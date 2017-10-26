/**
 * MIT licensed.
 */

'use strict';

var xmlbuilder = require("xmlbuilder");

var CONSTANTS = require('./constants');

var CreateContact = function (contactInfo) {
    this._name        = contactInfo.name || '';
    this._email       = contactInfo.email || '';
    this._phoneNumber = contactInfo.phoneNumber || '';
    this._displayName = contactInfo.display_name || this._name;
    this._isPrimary   = contactInfo.is_primary !== false;
    this._contactType = contactInfo.contact_type || CONSTANTS.CONTACT_TYPE.OTHER;

    this._extendedProperties = contactInfo.extended_property || [];
};

CreateContact.prototype.addExtendedProperty = function (name, value) {
    this._extendedProperties.push({name: name, value: value});
};

CreateContact.prototype.getXml = function () {
    var self = this;
    var obj  = {
        'atom:entry': {
            '@xmlns:atom'  : 'http://www.w3.org/2005/Atom',
            '@xmlns:gd'    : 'http://schemas.google.com/g/2005',
            'atom:category': {
                '@scheme': 'http://schemas.google.com/g/2005#kind',
                '@term'  : 'http://schemas.google.com/contact/2008#contact'
            },
            'gd:name'      : {
                'gd:fullName': self._name
            },
            'gd:email'     : {
                '@rel'        : 'http://schemas.google.com/g/2005#' + self._contactType,
                '@primary'    : self._isPrimary,
                '@address'    : self._email,
                '@displayName': self._displayName
            },
            "gd:phoneNumber": [
              {
                "@rel": "http://schemas.google.com/g/2005#mobile",
                "#text": self._phoneNumber
              }
            ],
            // 'gd:phoneNumber':
        }
    };


    var extendedPropertiesLen = self._extendedProperties.length;
    if (extendedPropertiesLen !== 0) {
        for (var idx = 0; idx < extendedPropertiesLen; idx++) {
            obj['atom:entry']['gd:extendedProperty'] = {
                '@name' : self._extendedProperties[idx].name,
                '@value': self._extendedProperties[idx].value
            };
        }
    }  
    return xmlbuilder.create(obj).toString();
};

module.exports = CreateContact;
