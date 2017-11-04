/**
 * MIT licensed.
 */

'use strict';

var lodash     = require('lodash');
var async      = require('async');
var GoogleAuth = require('google-auth-library');
var qs = require('querystring');
var https = require('https');
var ResponseParser   = require('./response-parser');
var CreateContactXML = require('./create-contact-xml');
var request = require('request');
var googleAuth = new GoogleAuth();

var GOOGLE_CONTACTS_URI  = 'https://www.google.com/m8/feeds/contacts/default/full/';
var DEFAULT_HEADERS      = {
    'GData-Version': '3.0',
    'User-Agent'   : 'Client'
};
var DEFAULT_QUERY_PARAMS = {
    'alt': 'json'
};


/**
 * @classdesc
 * This class interact with Google Contacts API.
 *
 * @param {String} clientId     The client id
 * @param {String} clientSecret The client secret key
 * @constructor
 */
var GoogleContacts = function (clientId, clientSecret) {
    this._clientId=clientId
    this._clientSecret=clientSecret
    this._auth = new googleAuth.OAuth2(clientId, clientSecret, '');
};


/**
 * Create a new Google Contact.
 *
 * @param {Object} options              New contact info.
 * @param {String} options.name         Full name.
 * @param {String} options.display_name Display name. If empty or undefined, option.name will be used as display name.
 * @param {String} options.email        Email Id.
 * @param {String} options.is_primary   True if it's primary email id of new contact. Default is true.
 * @param {String} options.contact_type Home or Other ? Default is other.
 * @param {Object} options.headers      HTTP Headers
 * @param {String} options.headers.GData-Version HTTP Headers. Default is 3.0.
 * @param {String} options.headers.User-Agent    HTTP Headers. Default is client.
 *
 * @param {Array}  options.extended_property            Array of extended property objects. Only extended
 *                                                      property with key and value is supported.
 * @param {String} options.extended_property[idx].name  Key of the property.
 * @param {String} options.extended_property[idx].value Value of the property.
 *
 * @param callback(error)
 */
GoogleContacts.prototype.addContact = function (options, callback) {
    var self             = this;

    var createContactXml = new CreateContactXML(options);

    options.headers = options.headers || {};

    var requestOptions = {
        uri    : GOOGLE_CONTACTS_URI,
        method : "POST",
        headers: lodash.defaults({'Content-Type': 'application/atom+xml'}, options.headers, DEFAULT_HEADERS),
        qs     : DEFAULT_QUERY_PARAMS,
        body   : createContactXml.getXml(),
        timeout: 10000                  // Milliseconds
    };

    self._auth.request(requestOptions, function (error, data, res) {
        if (error) {
            return callback(error);
        }

        if (res.statusCode !== 201) {
            return callback(ResponseParser.getError(res));
        }
        ResponseParser.parseGetContactsRawData(data, function (error, parsedData) {
            // if (!error) {
            //     contacts              = contacts.concat(parsedData.contacts);
            //     nextGoogleContactsUri = !lodash.isEmpty(parsedData.next) ? parsedData.next : null;
            // }
            // asyncCallback(error)
            return callback(error, parsedData);
        });

    });
};


/**
 * Get all/given contacts info. If options is null/empty, All the contact infos will be returned. If
 * contact_id is given, contact info for the given contact_id will be fetched.
 *
 *
 * @param {Object} options                       [Optional]
 * @param {String} options.contact_id            Id for which complete contact info to be returned
 * @param {Object} options.query_params          For more info -
 *                 options
 *     https://developers.google.com/google-apps/contacts/v3/reference#contacts-query-parameters-reference
 * @param {Object} options.headers               HTTP Headers
 * @param {String} options.headers.GData-Version HTTP Headers. Default is 3.0.
 * @param {String} options.headers.User-Agent    HTTP Headers. Default is client.
 *
 * @param callback(error, contacts)
 * @return  {Array}     A array of contact objects.

 */

GoogleContacts.prototype.getContacts = function (options, callback) {
    var self     = this;
    var contacts = [];

    if (!callback) {
        callback = options;
        options  = {};
    }else{
      if(options.contact_id){
        options.contact_id=options.contact_id
      }
      if(options.phoneNumber || options.email || options.name || options.other){
        options.other = options.other || (options.phoneNumber || options.email || options.name);
        options["query_params"]={q:options.other}
      }
    }
    var requestOptions = {
        uri    : GOOGLE_CONTACTS_URI,
        method : "GET",
        timeout: 10000,
        headers: options.headers ? lodash.defaults(options.headers, DEFAULT_HEADERS) : DEFAULT_HEADERS,
        qs     : options.query_params ? lodash.defaults(DEFAULT_QUERY_PARAMS, options.query_params) :
                 DEFAULT_QUERY_PARAMS
    };

    if (options && options.contact_id) {
        requestOptions.uri += options.contact_id;
    }

    var nextGoogleContactsUri = null;
    async.doWhilst(
        function (asyncCallback) {
            self._auth.request(requestOptions, function (error, data, res) {
                if (error) {
                    return asyncCallback(error);
                }

                if (res.statusCode !== 200) {
                    return asyncCallback(ResponseParser.getError(res));
                }

                ResponseParser.parseGetContactsRawData(data, function (error, parsedData) {
                    if (!error) {
                        contacts              = contacts.concat(parsedData.contacts);
                        nextGoogleContactsUri = !lodash.isEmpty(parsedData.next) ? parsedData.next : null;
                    }
                    asyncCallback(error)
                });
            });
        },
        function () {
            requestOptions.uri = nextGoogleContactsUri; // Set URI to fetch next list of contacts.
            return nextGoogleContactsUri !== null;
        },
        function (error) {
            callback(error, contacts);
        }
    );
};


GoogleContacts.prototype.upContact = function (requestData,options, callback) {
    var self             = this;

    var createContactXml = new CreateContactXML(options);

    options.headers = options.headers || {};
    if(options.headers){
      options.headers["If-Match"]=requestData.etag;
    }
    var url=GOOGLE_CONTACTS_URI;
    var requestOptions = {
        uri    : GOOGLE_CONTACTS_URI+requestData.contact_id,
        method : "PUT",
        headers: lodash.defaults({'Content-Type': 'application/atom+xml'}, options.headers, DEFAULT_HEADERS),
        qs     : DEFAULT_QUERY_PARAMS,
        body   : createContactXml.getXml(),
        timeout: 10000                  // Milliseconds
    };

    self._auth.request(requestOptions, function (error, data, res) {
        if (error) {
            return callback(error);
        }
        if (res.statusCode !== 200) {
            return callback(ResponseParser.getError(res));
        }
        ResponseParser.parseGetContactsRawData(data, function (error, parsedData) {
            // if (!error) {
            //     contacts              = contacts.concat(parsedData.contacts);
            //     nextGoogleContactsUri = !lodash.isEmpty(parsedData.next) ? parsedData.next : null;
            // }
            // asyncCallback(error)
            return callback(error, parsedData);
        });

    });
};

GoogleContacts.prototype.updateContacts = function (data,updates,callback) {
  var self             = this;
  var options = {
    headers     :{                          // Optional
          'GData-Version': '3.0',
          'User-Agent'   : 'SomeAgent'
      },
  };

  if(data.contact_id){
    options.contact_id=data.contact_id
  }
  if(data.phoneNumber || data.email || data.name || data.other){
    data.other = data.other || (data.phoneNumber || data.email || data.name);
    options["query_params"]={q:data.other}
  }
  if(options.contact_id || options.query_params){
    this.getContacts(options,function (error, data) {
        console.log("Error " + error);
        if(error){
          callback(error)
        }
        else{
          if(data && data[0]){
            var contact_id=data[0]["id"];
            var etag=data[0]["etag"];
            var requestData={contact_id:contact_id,etag:etag}
            self.upContact(requestData,updates, function (error,cont) {
              callback(error,cont)
            });
          }
          else {
            callback({"message":"contact not found"})
          }
        }
    });
  }
  else{
    callback({message:"invalid request"})
  }
};

GoogleContacts.prototype.deleteContactsByFilter = function (data,callback) {
  var self             = this;
  var options = {
    headers     :{                          // Optional
          'GData-Version': '3.0',
          'User-Agent'   : 'SomeAgent'
      },
  };

  if(data.contact_id){
    options.contact_id=data.contact_id
  }
  if(data.phoneNumber || data.email || data.name || data.other){
    data.other = data.other || (data.phoneNumber || data.email || data.name);
    options["query_params"]={q:data.other}
  }
  if(options.contact_id || options.query_params){
    this.getContacts(options,function (error, data) {
        console.log("Error " + error);
        if(error){
          callback(error)
        }
        else{
          if(data && data[0]){
            var contact_ids=data[0]["id"];
            var etag=data[0]["etag"];
            var requestData={contact_ids:contact_ids,etag:etag}
            self.deleteContacts(requestData, function (error,cont) {
              callback(error,cont)
            });
          }
          else {
            callback({"message":"contact not found"})
          }
        }
    });
  }
  else{
    callback({message:"invalid request"})
  }
};



/**
 *  Delete a contact or a list of contacts.
 *
 * @param {Object}         options
 * @param {Object}         options.headers               HTTP Headers.
 * @param {String}         options.headers.GData-Version HTTP Headers. Default is 3.0.
 * @param {String}         options.headers.User-Agent    HTTP Headers. Default is client.
 * @param {Array | String} options.contact_ids           Contact ids to be deleted.
 * @param callback(error)
 */
GoogleContacts.prototype.deleteContacts = function (options, callback) {
    var self = this;

    var filter={};
    if(options.contact_ids){
      if (!Array.isArray(options.contact_ids)) {
          filter.contact_ids = {type:"contact_ids","data":[options.contact_ids]};
          options.contact_ids = [options.contact_ids];
      }
      options.headers = options.headers || {};

      var _deleteContact = function (contactId, callback) {
          async.waterfall([function (asyncCallback) {
              self.getContacts({contact_id: contactId}, function (error, contacts) {
                  if (error && error.code === 404) {
                      return asyncCallback(null, []);
                  }

                  asyncCallback(error, contacts);
              });
          }, function (contacts, asyncCallback) {
              if (contacts.length === 0) {
                  return asyncCallback();
              }

              var requestOptions = {
                  uri    : GOOGLE_CONTACTS_URI + contactId,
                  method : "POST",
                  timeout: 10000,
                  headers: lodash.defaults({"If-Match": contacts[0].etag, "X-HTTP-Method-Override": "DELETE"},
                                           options.headers, DEFAULT_HEADERS)
              };
              self._auth.request(requestOptions, function (error, data, res) {
                  if (error) {

                      return asyncCallback(error,data,res);
                  }

                  if (res.statusCode !== 200 && res.statusCode !== 404) {
                      return asyncCallback(ResponseParser.getError(res),data, res);
                  }

                  asyncCallback();
              });
          }], callback)
      };

      async.each(options.contact_ids, function (contactId, asyncCallback) {
          _deleteContact(contactId, function (error) {
              // Retry once more if precondition failed error received.
              if (error && error.code === 412) {
                  return _deleteContact(contactId, asyncCallback);
              }

              asyncCallback(error);
          });
      }, callback);
    }
    else{
      console.log(options)
      self.deleteContactsByFilter(options,function(err,contacts){
        callback(err,contacts)
      })
    }
    // else if(options.name){
    //   if (!Array.isArray(options.name)) {
    //       filter.name = {type:"name","data":[options.name]};
    //   }
    // }
    // else if(options.phoneNumber){
    //   if (!Array.isArray(options.phoneNumber)) {
    //       filter.phoneNumber = {type:"phoneNumber","data":[options.phoneNumber]};
    //   }
    // }
    // else if(options.email){
    //   if (!Array.isArray(options.email)) {
    //       filter.email = {type:"email","data":[options.email]};
    //   }
    // }
    // else if(options.other){
    //   if (!Array.isArray(options.other)) {
    //       filter.other = {type:"other","data":[options.other]};
    //   }
    // }else{
    //   callback({message:"Please send proper request"})
    // }



};

/**
 * Set user's credentials. If you provide a refresh_token and expiry_date (milliseconds since the Unix Epoch) and the
 * access_token has expired, the access_token will be automatically refreshed and the request is replayed.
 *
 *
 * @param {Object} credentials                  User's credentials object
 * @param {String} credentials.access_token     Access token
 * @param {String} credentials.refresh_token    Refresh token to get fresh access token on expiration of access token
 * @param {String} credentials.token_type       Access token type
 * @param {Number} credentials.expiry_date      Expiry date of access token. Set it true to force a refresh
 *
 * @public
 */
GoogleContacts.prototype.setUserCredentials = function (credentials) {
    this.credentials=credentials;
    this._auth.credentials = credentials
};


GoogleContacts.prototype.refreshToken = function (cb) {
  request.post('https://accounts.google.com/o/oauth2/token', {
    form: {
      refresh_token: this.credentials.refresh_token
    , client_id: this._clientId
    , client_secret: this._clientSecret
    , grant_type: 'refresh_token'
    }
  , json: true
  }, function (err, res, body) {
    if (err) return cb(err, body, res);
    if (parseInt(res.statusCode / 100, 10) !== 2) {
      if (body.error) {
        return cb(new Error(res.statusCode + ': ' + (body.error.message || body.error)), body, res);
      }
      if (!body.access_token) {
        return cb(new Error(res.statusCode + ': refreshToken error'), body, res);
      }
      return cb(null, body, res);
    }
    cb(null,  {
      accessToken: body.access_token
    , expiresIn: body.expires_in
    , expiresAt: +new Date + parseInt(body.expires_in, 10)
    , idToken: body.id_token
    }, res);
  });
}





module.exports = GoogleContacts;
