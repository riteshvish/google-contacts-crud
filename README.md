Description
===========

[Node.js](http://nodejs.org/) wrapper for the [Google Contacts API](https://developers.google.com/google-apps/contacts/v3/).

Requirements
============

* [Node.js](http://nodejs.org/) -- v0.10.32 or newer

Installation
============

    npm install google-contacts-crud

Examples
========

* Set user's credentials. If you provide a refresh_token and expiry_date (milliseconds since the Unix Epoch) and the access_token has expired, the access_token will be automatically refreshed and the request is replayed.

```javascript
var GoogleContacts = require("google-contacts-crud");



var googleContacts = new GoogleContacts(CLIENT_ID, CLIENT_SECRET);
var credentials    = {
  access_token : "youraccesstoken",
  expiry_date  : 3600,               // Set it true to force a refresh always.
  refresh_token: "yourrefresh_token",
  token_type   : "Bearer"
};

CLIENT_ID and CLIENT_SECRET
https://console.developers.google.com/apis/
Access Token Ref https://developers.google.com/oauthplayground/?code=4/

googleContacts.setUserCredentials(credentials);
```

* Fetch all the contact's info such as 'name', 'email id', 'contact id' and 'contact type'.

```javascript
googleContacts.getContacts(function (error, data) {
    console.log("Error " + error);
    console.log("Data " + JSON.stringify(data));
});
```

* Fetch the contact's info such as 'name', 'email id', 'contact id' and 'contact type' for a given contact id.

```javascript
var options = {
  contact_id: '123456789',
  headers   :{                          // Optional
        'GData-Version': '3.0',
        'User-Agent'   : 'SomeAgent'
    },
};
googleContacts.getContacts(options, function (error, data) {
    console.log("Error " + error);
    console.log("Data " + JSON.stringify(data));
});
```

* Fetch the contact's info using query parameters.

  For more info about [query_params](https://developers.google.com/google-apps/contacts/v3/reference#contacts-query-parameters-reference)

```javascript
var options = {
  query_params: {    
    q: "your@gmail.com"
  },
  headers     :{                          // Optional
        'GData-Version': '3.0',
        'User-Agent'   : 'SomeAgent'
    },
};
googleContacts.getContacts(options, function (error, data) {
    console.log("Error " + error);
    console.log("Data " + JSON.stringify(data));
});
```

* Add a new contact into user's google contacts.

```javascript
var options = {
    name        : 'Ritesh Vishwakarma',                    // Default is ''
    display_name: 'Ritesh Vishwakarma',              // Default is ''
    email       : 'your@gmail.com',          
    is_primary  : true,                     // Default is true
    contact_type: 'other',                  // Default is other.
    headers     :{                          // Optional
        'GData-Version': '3.0',
        'User-Agent'   : 'SomeAgent'
    },
    extended_property: [                    // Optional
        {name: 'custom_key_2', value: 'custom_value_2'},
        {name: 'custom_key_2', value: 'custom_value_2'}
    ]
};
googleContacts.addContact(options, function (error) {
    console.log("Error " + error);
});
```

* Delete a contact or a list of contacts from user's google contacts list.

```javascript
var options = {
    contact_ids: '1232131bv4324',          // Or a array of contact ids e.g. ['1332rweff4', '21312edsadsa',...]
    headers    :{                          // Optional
        'GData-Version': '3.0',
        'User-Agent'   : 'SomeAgent'
    }
};
googleContacts.deleteContacts(options, function (error) {
    console.log("Error " + error);
});
```
