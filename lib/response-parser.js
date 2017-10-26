/**
 * MIT licensed.
 */

'use strict';

var lodash = require("lodash");

var GoogleContactsParser = function () {
};

GoogleContactsParser.parseGetContactsRawData = function (jsonData, callback) {
    var parsedData   = {};
    var contactsJSON = null;
    var links        = null;

    // Extract contacts JSON
    if (jsonData && jsonData.entry) {
        contactsJSON = [jsonData.entry];
    } else if (jsonData && jsonData.feed && jsonData.feed.entry) {
        contactsJSON = jsonData.feed.entry;
    }

    // Extract links
    if (jsonData && jsonData.feed && jsonData.feed.link) {
        links = jsonData.feed.link
    }

    parsedData.contacts = _parseContacts(contactsJSON);
    parsedData.next     = _parseNextLink(links);

    callback(null, parsedData);
};

GoogleContactsParser.getError = function (response) {
    var error = new Error();

    error.code = response.statusCode;
    switch (error.code) {
        case 401:
            error.message = "Auth error.";
            break;
        case 404:
            error.message = "Non Found. Requested item not found.";
            break;
        case 412:
            error.message = "Precondition failed. Request's precondition failed.";
            break;
        default:
            error.message = "Google Contact server error.";
    }

    return error;
};

var _parseContacts = function (contactsJSON) {
    var contacts = [];

    if (!contactsJSON) {
        return contacts;
    }
    contactsJSON.forEach(function (contactJSON) {
        var contactURI     = lodash.get(contactJSON, 'id.$t', '');
        var contactTypeRel = lodash.get(contactJSON, 'gd$email.0.rel', '');
        var contact        = {
              name        : lodash.get(contactJSON, 'title.$t', ''),
              email       : lodash.get(contactJSON, 'gd$email.0.address', ''), // Only save 1st email. There could be more
                                                                               // than one email address.
              contact_type: contactTypeRel.substring(contactTypeRel.lastIndexOf('#') + 1), // other, work etc, Only save
                                                                                           // 1st email's contactType
              id          : contactURI.substring(contactURI.lastIndexOf('/') + 1),
              phoneNumber : lodash.get(contactJSON, 'gd$phoneNumber.0.$t', ''),
              etag        : lodash.get(contactJSON, 'gd$etag', ''),
              display_name: lodash.get(contactJSON, 'gd$email.0.displayName', ''),
              shortmetadata:{id: contactURI.substring(contactURI.lastIndexOf('/') + 1),name:contactJSON['gd$name'],email:contactJSON['gd$email'],phoneNumber:contactJSON['gd$phoneNumber']},
             fullmetadata:contactJSON
           }

        contacts.push(contact);      
    });

    return contacts;
};

var _parseNextLink = function (links) {
    var nextLink = null;

    if (lodash.isEmpty(links)) {
        return nextLink;
    }

    links.forEach(function (link) {
        if (link.rel !== "next") {
            return;
        }

        nextLink = link.href;
    });

    return nextLink;
};

module.exports = GoogleContactsParser;
