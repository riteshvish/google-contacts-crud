
var GoogleContacts = require("google-contacts-crud");
var OAuth2Data=require('./key.json');

var CLIENT_ID=OAuth2Data.client.id;
var CLIENT_SECRET=OAuth2Data.client.secret;
var googleContacts = new GoogleContacts(CLIENT_ID, CLIENT_SECRET);
var credentials    = OAuth2Data.credentials

googleContacts.setUserCredentials(credentials);


// create

var count=0;
  var createData = {
      name        : 'Ritesh Vishwakarma',                    // Default is ''
      display_name: 'Ritesh Raj Vishwakarma',              // Default is ''
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

// response contact
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

// read

googleContacts.getContacts(function (error,contact) {
  console.log(error)
  console.log(contact.length)
  for (var i = 0; i < 5; i++) {
    delete contact[i]["shortmetadata"]
    delete contact[i]["fullmetadata"]

    console.log(contact[i]);
  }
});

pass filter object
filter based on {name,email,phoneNumber,other,contact_id} use any one
filter

googleContacts.getContacts({"email":"ritesh@gmail.com"},function (error,contact) {
  console.log(error)
  console.log(contact.length)
});

// update
  var updateData = {

      email       : 'riteshvish@gmail.com',
      phoneNumber: '4321043210',                  // Default is other.
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


//delete


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
googleContacts.deleteContacts({contact_ids:contact_ids},function (error, data) {
    console.log("error",error);
    console.log("Data " + data);
});


//refresh

googleContacts.refreshToken(function(err,token){
  console.log("error",error);
  console.log("Data " + token);
})
