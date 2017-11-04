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

* Set user's credentials.

```javascript
var GoogleContacts = require("google-contacts-crud");



var googleContacts = new GoogleContacts(CLIENT_ID, CLIENT_SECRET);
var credentials    = {
  access_token : "youraccesstoken",
  expiry_date  : 3600,               
  refresh_token: "yourrefresh_token",
  token_type   : "Bearer"
};



googleContacts.setUserCredentials(credentials);
```
How to get CLIENT_ID and CLIENT_SECRET
Steps
* Create A Google Project.
* Enable Google Contact Api  (enable apis and services -> select Google Contact Api -> enable)
* Create CLIENT_ID and CLIENT_SECRET (Create Credentials -> OAuth Client ID -> Web Application)
        * Enter App Name
        * Authorized JavaScript origins (your website name )
        * Authorized redirect URIs (redirect url, if you don't have, use 'https://developers.google.com/oauthplayground')

You get a initials access_token
Steps
* [Open OAuth Background for Access Token](https://developers.google.com/oauthplayground/?code=4)
* Enter CLIENT_ID and CLIENT_SECRET (Settings ->  Use your own OAuth credentials)
* Select https://www.google.com/m8/feeds/ (Select & authorize APIs ->  Contacts V3)
* Click on Authorize APIs   
    * Google Login Form will Popup to authorize your scope
    * After authorization it will redirect to your given redirect url (https://developers.google.com/oauthplayground) with authorize token
* Click on Exchange authorization code for tokens Button to get your first access token

** Note Access Token will get expire after 3600 secs [To Check your Access Token Status](https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=your_access_token)






[Create Google Project ](https://console.developers.google.com/apis)
[OAuth Background for Access Token](https://developers.google.com/oauthplayground/?code=4)





* Fetch all the contact's info such as 'name', 'email id', 'contact id',phoneNumber  and 'contact type'.

```javascript
googleContacts.getContacts(function (error, data) {
    console.log("Error " + error);
    console.log("Data " + JSON.stringify(data));
});
```

* Fetch the contact's info such as 'name', 'email id', 'contact id',phoneNumber and 'contact type' for a given contact id.

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
    q: "your@gmail.com" // your phoneNumber
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

* To Refresh Google Access Token.

```javascript
googleContacts.refreshToken(function (err, data, res) {
    console.log("Error " + err);
});

response data


{ accessToken:"new access token",
  expiresIn: 3600,
  expiresAt: 1509790743244,
  idToken: undefined
}

```
