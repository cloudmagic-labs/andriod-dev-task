# iOS developer task
## Overview

We've set up a simple NodeJS application which gives you a bunch of APIs to access and manipulate data. You will need to use these APIs and build an iOS app. We prefer writing in Swift but you are free to use Objective C also

Feel free to make necessary changes in the server side code.

## API's
- `GET /api/message/` - get a list of messages
- `GET /api/message/:id` - get one message
- `DELETE /api/message/:id` - delete one message

**Your task, will be to consume these API's & build a UI which looks beautiful & more importantly feels intuitive. For an example of how the UI should look like, check out our app CloudMagic.**

Here are few details which you might need:

- Serves static content from the static_content & bower_components directory
- You can have your JS, CSS files & images/sprites in static_content & any plugins can go in bower_components
- Router is at controllers/router.js
- Web controllers are at controllers/web/
- API controllers are at controller/api/

## How to setup

- Make sure you have got node & npm installed
- Fork & clone this repo
- Navigate into src directory
- Execute `npm install` - this installs the dependencies
- Execute `npm start` - this will start the server
