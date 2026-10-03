#!/usr/bin/env node
/* Canonical contract for member-personalized UI. Keeps preferences separate from service data/routes. */
'use strict';
const required=['member_id','service_id','visible','pinned','sort_order'];
const defaults={visible:true,pinned:false,sort_order:0};
if(require.main===module){console.log(JSON.stringify({contract:'member_preferences',required,defaults,rule:'hide/remove changes presentation only; service route/data remain canonical'},null,2));}
module.exports={required,defaults};
