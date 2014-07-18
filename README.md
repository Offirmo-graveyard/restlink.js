restlink.js
===========

[![Project status](http://img.shields.io/badge/project_status-highly_experimental-red.png)](http://offirmo.net/classifying-open-source-projects-status/)
[![license](http://img.shields.io/badge/license-public_domain-brightgreen.png)](http://unlicense.org/)
[![Gittip](http://img.shields.io/gittip/Offirmo.png)](https://www.gittip.com/Offirmo/)

NOT READY !!! PLEASE WAIT A BIT, DEV ACTIVELY IN PROGRESS !

A powerful REST server for node.js + browser with batteries (local, http and socket.io interfaces, optional middleware including sessions, security...) WORK IN PROGRESS
Strong points :
- works in browser
- transport independent
- allows full HTTP capabilities (i.e. uncommon verb like BREW or anything)
- if allowed by transport, provides integrated push support (with special GET = subscribe)
- ...

License : public domain (http://unlicense.org/)


.defer
.then
.spread
.resolve
.reject
expect(false).to.be.ok;
BB sync

TODO
- session and request timeout
- OPTIONS
- connect adapter
- security
  - black / whitelist
  - filter returned errors
- leaks analysis
- logs input, output, exceptions...
- perf tests
- remove chai.should usage for IE

TODO one day
- ECMA 6 yield
- replace startable_objects with mixins/startable
- error handling : exceptions ? promises ? -->Should always handle exceptions anyway

See also :
http://www.linkedin.com/groups/Which-is-best-framework-building-2906459.S.5828366732095406080
https://github.com/mcavage/node-restify
https://github.com/wprl/baucis

Interesting reads
* http://www.codeshttp.com/
* http://julien-pauli.developpez.com/tutoriels/web/http/?page=page_3

REST routes :
@see http://guides.rubyonrails.org/routing.html
   -> RoR creates 7 routes for a resource

  BB     OPTIONS              meta
  BB     POST /order          create
         POST /order/123      create/update
*    RoR POST /orders         create_multiple ?
  BB RoR DELETE /order/123    delete
*        DELETE /orders       delete all
*        DELETE /order        delete all (variant)
     RoR PUT /order/123       create/update
     RoR PATCH /order/123     update
     RoR GET /orders          index = read all
     RoR GET /orders/new      [non API] RoR return a form to create such a rsrc
     RoR GET /orders/123/edit [non API] RoR return a form to edit this rsrc
*        GET /order           index = read all
     RoR GET /order/123       read
         GET /order?foo=bar   find


TOREVIEW
- delete of a non existing resource ? OK ?
- singular / plural routes ?
- ruby REST routes ?
- how to delete attributes in REST ?
http://webapplog.com/express-js-4-node-js-and-mongodb-rest-api-tutorial
https://github.com/originalmachine/distill
