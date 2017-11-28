Description
===========

[Node.js](http://nodejs.org/) wrapper for the [Google Contacts API](https://developers.google.com/google-apps/contacts/v3/).

We can perfrom CRUD on Google Contacts

* C : addContacts // single contacts at a time
* R : getContacts // all or with filters
* U : updateContacts // single contact update at a time
* D : deteteContacts // mulitple delete with contact_ids and with filter single delete

[Example Project](https://github.com/riteshvish/google-contacts-crud/tree/master/example).

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
        * Authorized redirect URIs (redirect URL, if you don't have, use 'https://developers.google.com/oauthplayground')

You get a initials access_token
Steps
* [Open OAuth Background for Access Token](https://developers.google.com/oauthplayground/?code=4)
* Enter CLIENT_ID and CLIENT_SECRET (Settings ->  Use your own OAuth credentials)
* Select https://www.google.com/m8/feeds/ (Select & authorize APIs ->  Contacts V3)
* Click on Authorize APIs   
    * Google Login Form will Popup to authorize your scope
    * After authorization, it will redirect to your given redirect URL (https://developers.google.com/oauthplayground) with authorizing token
* Click on Exchange authorization code for tokens Button to get your first access token

** Note Access Token will get expire after 3600 secs [To Check your Access Token Status](https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=your_access_token)





[Create Google Project ](https://console.developers.google.com/apis)
[OAuth Background for Access Token](https://developers.google.com/oauthplayground/?code=4)





* Fetch all the contact's info such as 'name', 'email id', 'contact id',phoneNumber   ,'contact type', shortmetadata and fullmetadata.

we can use fullmetadata to get additional information about a contact

  For more info about [query_params](https://developers.google.com/google-apps/contacts/v3/reference#contacts-query-parameters-reference)

```javascript
// read

googleContacts.getContacts(function (error,contact) {
  console.log(error)
  console.log(contact)
});

// pass filter object
// filter based on {name,email,phoneNumber,other,contact_id} use any one
// filter

googleContacts.getContacts({"email":"ritesh@gmail.com"},function (error,contact) {
  console.log(error)
  console.log(contact.length)
});
```




* Add a new contact into user's Google contacts.

```javascript

// create

var count=0;
  var createData = {
      name :'Ritesh Vishwakarma', // Default is ''
      display_name: 'Ritesh Raj Vishwakarma',  // Default is ''
      email       : 'ritesh@gmail.com',
      is_primary  : true,                     // Default is true
      contact_type: 'other',                  // Default is other.
      phoneNumber: '9876543210',                  // Default is other.
      headers     :{
          'GData-Version': '3.0',
          'User-Agent'   : 'SomeAgent'
      },
      extended_property: [                    // Optional
          {name: 'custom_key_2', value: 'custom_value_2'},
          {name: 'custom_key_2', value: 'custom_value_2'}
      ]
  };

googleContacts.addContact(createData, function (error,contact) {
  console.log(error)
  console.log(contact)
});

response contact
/*
{ contacts:
   [ { name: 'Ritesh Vishwakarma',
       email: 'ritesh@gmail.com',
       contact_type: 'other',
       id: '68eaba200b442ca7',
       phoneNumber: '9876543210',
       etag: '"Q3o4fjVSLit7I2A9XBZaGE0ORgA."',
       display_name: 'Ritesh Raj Vishwakarma',
       shortmetadata: [Object],
       fullmetadata: [Object] } ],
  next: null }
*/
```

* Update a contact or a list of contacts from user's Google contacts list.

```javascript
// single update with filter
  var updateData = {
      email       : 'riteshvish@gmail.com',
      phoneNumber: '4321043210',        
      headers     :{
          'GData-Version': '3.0',
          'User-Agent'   : 'SomeAgent'
      }
  };
// pass filter object
// filter based on {name,email,phoneNumber,other,contact_id} use any one
// filter
// updates only first records
googleContacts.updateContacts({email:"ritesh@gmail.com"},updateData,function (error, data) {
    console.log(error);
    console.log("Data " + JSON.stringify(data));
});

googleContacts.updateContacts({phoneNumber:"9876543210"},updateData,function (error, data) {
    console.log(error);
    console.log("Data " + JSON.stringify(data));
});

```

* Delete a contact or a list of contacts from user's Google contacts list.

```javascript
// single delete with filter
googleContacts.deleteContacts({phoneNumber:"4321043210"},function (error, data) {
    console.log("error",error);
    console.log("Data " + data);
});
var contact_ids=[
  '3e8b42898e977d',
  '305417c8c7e99a1',
  '6801c200cab6b86',
  '85924740a074822',
  '8e103600a8c2c97'
]
// multiple delete using contact_ids we will get id from getContacts
googleContacts.deleteContacts({contact_ids:contact_ids},function (error, data) {
    console.log("error",error);
    console.log("Data " + data);
});
```

* To Refresh Google Access Token.

```javascript
googleContacts.refreshToken(function(err,token){
  console.log("error",error);
  console.log("Data " + token);
})
response data

{ accessToken:"new access token",
  expiresIn: 3600,
  expiresAt: 1509790743244,
  idToken: undefined
}

```
If you find any error or you facing any difficulty please create an issue.
