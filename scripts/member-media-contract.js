#!/usr/bin/env node
/* Canonical member media contract. UI may fall back locally, but persistent media must be account-scoped. */
'use strict';
const contract={member_id:'uuid',avatar_url:'string|null',bucket:'member-avatars',pathPattern:'{member_id}/avatar.{ext}',maxBytes:2097152};
if(require.main===module)console.log(JSON.stringify(contract,null,2));
module.exports=contract;
