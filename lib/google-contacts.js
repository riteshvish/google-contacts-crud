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
    console.log(this._auth);
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
 *          [{
 *              name: 'Ram',
 *              email: 'ram@gmail.com',
 *              contact_type: 'other',
 *              id: '12wer4577',
 *              etag: 'cdscdscdscfw'
 *          }]
 */

GoogleContacts.prototype.getContacts = function (options, callback) {
    var self     = this;
    var contacts = [];

    if (!callback) {
        callback = options;
        options  = {};
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
    console.log(requestOptions.uri,"my url");
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
    console.log("data to dat",options);
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

        callback();
    });
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

    if (!Array.isArray(options.contact_ids)) {
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
                    return asyncCallback(error);
                }

                if (res.statusCode !== 200 && res.statusCode !== 404) {
                    return asyncCallback(ResponseParser.getError(res));
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
    this._auth.credentials = credentials
};

GoogleContacts.prototype.refreshAccessToken = function (refreshToken, cb) {
  if (typeof params === 'function') {
    cb = params;
    params = {};
  }
  console.log(this._clientId);
  console.log(this._clientSecret);
  var data = {
    refresh_token: refreshToken,
    client_id: this._clientId,
    client_secret: this._clientSecret,
    grant_type: 'refresh_token'
  }
  console.log(data);
  var body = qs.stringify(data);

  var opts = {
    host: 'accounts.google.com',
    port: 443,
    path: '/o/oauth2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': body.length
    }
  };
  // console.log(opts)

  var req = https.request(opts, function (res) {
    var data = '';
    res.on('end', function () {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        var error = new Error('Bad client request status: ' + res.statusCode);
        return cb(error);
      }
      try {
        data = JSON.parse(data);
        cb(null, data.access_token);
      }
      catch (err) {
        cb(err);
      }
    });

    res.on('data', function (chunk) {
      data += chunk;
    });

    res.on('error', function (err) {
      cb(err);
    });

    //res.on('close', onFinish);
  }).on('error', function (err) {
    cb(err);
  });

  req.write(body);
  req.end();
}


module.exports = GoogleContacts;
