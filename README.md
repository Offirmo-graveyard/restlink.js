restlink.js
===========

NOT READY !!! PLEASE WAIT A BIT, DEV ACTIVELY IN PROGRESS !

A powerful REST server for node.js + browser with batteries (local, http and socket.io interfaces, optional middleware including sessions, security...) WORK IN PROGRESS

See also :
https://github.com/mcavage/node-restify
https://github.com/wprl/baucis

REST routes :

  BB POST /order          create
     POST /order/123      create/update
*    POST /orders         create_multiple ?
  BB DELETE /order/123    delete
*    DELETE /orders       delete all
*    DELETE /order        delete all (variant)
     PUT /order/123       create/update
     GET /orders          read all
*    GET /order           read all
     GET /order/123       read
     GET /order?foo=bar   find

TOREVIEW
- delete of a non existing resource ? OK ?
- singular / plural routes ?
- ruby REST routes ?
- how to delete attributes in REST ?

TODO
- replace startable_objects with mixins/startable
