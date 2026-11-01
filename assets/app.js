(()=>{
 'use strict';
 const alphabet='bcdfghjklmnpqrstvwxyz0123456789!',d64Alphabet='bcdfghjklmnpqrstvwxyz0123456789?';
 const skillNames=["I'm Too Young to Die",'Hey, Not Too Rough','Hurt Me Plenty','Ultra-Violence'];
 const d64Skills=['Be Gentle!','Bring It On!','I Own Doom!','Watch Me Die!'];
 const weaponNames=['Shotgun','Super Shotgun','Chaingun','Rocket Launcher','Plasma Rifle','BFG9000','Chainsaw'];
 const d64Weapons=['Chainsaw','Shotgun','Super Shotgun','Chaingun','Missile Launcher','Plasma Gun','BFG9000','Unmaker'];
 const d64Levels=['Staging Area','The Terraformer','Main Engineering','Holding Area','Tech Center','Alpha Quadrant','Research Lab','Final Outpost','Even Simpler','The Bleeding','Terror Core','Altar of Pain','Dark Citadel','Eye of the Storm','Dark Entries','Blood Keep','Watch Your Step','Spawned Fear','The Spiral','Breakdown','Pitfalls','Burnt Offerings','Unholy Temple','No Escape','Cat and Mouse','Hardcore','Playground','The Absolution','Outpost Omega','The Lair','In the Void','Hectic'];
 const d64PasswordTable=[1,8,9,5,6,2,7,0,4,3];
 const $=id=>document.getElementById(id),readInt=id=>Number.parseInt($(id).value,10),choice=id=>document.querySelector(`input[name="${id}"]:checked`),readChoice=id=>Number.parseInt(choice(id).value,10),mode=()=>choice('gameMode').value;
 const quantize=(value,max)=>value===0?0:Math.min(8,Math.ceil(value*8/max));
 $('weaponChecks').innerHTML=weaponNames.map((name,i)=>`<label><input type="checkbox" id="gWeapon${i}"> ${name}</label>`).join('');
 $('d64WeaponChecks').innerHTML=d64Weapons.map((name,i)=>`<label><input type="checkbox" id="d64Weapon${i}"> ${name}</label>`).join('');
 function decodeClassic(code){
  const clean=code.toLowerCase().replace(/\s/g,'');
  if(clean.length!==10)throw Error('Enter all 10 password characters.');
  const symbols=Array.from(clean,ch=>{const n=alphabet.indexOf(ch);if(n<0)throw Error('The password contains an invalid character.');return n;});
  const raw=symbols.slice();for(let i=0;i<9;i++)raw[i]^=raw[9];
  let check=0;for(let i=0;i<9;i++)check^=raw[i];if(check!==raw[9])throw Error('Checksum mismatch. Check the password characters.');
  const bytes=new Array(6).fill(0);let bit=0;
  for(let byte=0;byte<6;byte++){let v=0;for(let b=0;b<8;b++,bit++){const group=Math.floor(bit/5),offset=bit%5,source=raw[group]??0;if(source&(16>>offset))v|=0x80>>b;}bytes[byte]=v;}
  const level=bytes[0]>>>2,skill=bytes[0]&3,max=mode()==='final'?29:59;
  if(level<1||level>max||level===54)throw Error(`This password contains an invalid ${mode()==='final'?'Final DOOM':'console DOOM'} level.`);
  const clip=bytes[2]>>>4,shell=bytes[2]&15,cell=bytes[3]>>>4,rocket=bytes[3]&15,h=bytes[4]>>>4,a=bytes[4]&15,armorType=bytes[5]>>>3;
  if([clip,shell,cell,rocket,h,a].some(n=>n>8))throw Error('Invalid password: an ammo, health, or armor value is out of range.');
  if(armorType>2)throw Error('Invalid password: unknown armor type.');
  const scale=(bytes[1]&128)?2:1,weapons=weaponNames.filter((_,i)=>bytes[1]&(1<<i));
  return {level,skill,skills:skillNames,health:h*25,armor:a*25,armorType:['None','Green','Blue'][armorType],backpack:!!(bytes[1]&128),weapons,ammo:[clip*25*scale,shell*6.25*scale,rocket*6.25*scale,cell*37.5*scale].map(Math.floor),levelName:level===1?'Hangar':null};
 }
 function decodeD64(code){
  const clean=code.toLowerCase().replace(/\s/g,'');if(clean.length!==16)throw Error('Enter all 16 DOOM 64 password characters.');
  const values=Array.from(clean,ch=>{const n=d64Alphabet.indexOf(ch);if(n<0)throw Error('The DOOM 64 password contains an invalid character.');return n;});
  const bytes=new Array(10).fill(0);let bit=0;
  for(const val of values)for(let b=4;b>=0;b--,bit++)if(val&(1<<b))bytes[bit>>3]|=0x80>>(bit&7);
  for(let i=9;i>=0;i--)bytes[i]^=bytes[d64PasswordTable[i]];
  const words=[(bytes[0]<<8)|bytes[1],(bytes[2]<<8)|bytes[3],(bytes[4]<<8)|bytes[5]],sumCheck=(~(words[0]+words[1]+words[2]))&0xffff,xorCheck=(~(words[0]^words[1]^words[2]))&0xffff;
  if(words[0]===undefined||(((bytes[6]<<8)|bytes[7])!==sumCheck)||(((bytes[8]<<8)|bytes[9])!==xorCheck))throw Error('DOOM 64 password checksum mismatch.');
  const level=bytes[0]>>>2,skill=bytes[0]&3,armorType=bytes[5]&3,backpack=!!(bytes[5]&128),art=(bytes[5]>>>2)&7;
  if(level<1||level>32)throw Error('This mode accepts original Nintendo 64 levels 1–32.');
  const clip=bytes[2]>>>4,shell=bytes[2]&15,cell=bytes[3]>>>4,rocket=bytes[3]&15,h=bytes[4]>>>4,a=bytes[4]&15;
  if([clip,shell,cell,rocket,h,a].some(n=>n>8))throw Error('Invalid DOOM 64 password: an ammo, health, or armor value is out of range.');
  if(armorType>2)throw Error('Invalid DOOM 64 password: unknown armor type.');
  const scale=backpack?2:1;
  return {level,levelName:d64Levels[level-1],skill,skills:d64Skills,health:h*25,armor:a*25,armorType:['None','Green','Blue'][armorType],backpack,weapons:d64Weapons.filter((_,i)=>bytes[1]&(1<<i)),ammo:[Math.floor(clip*200/8)*scale,Math.floor(shell*50/8)*scale,Math.floor(rocket*50/8)*scale,Math.floor(cell*300/8)*scale],artifacts:[art&1?'Speed':null,art&4?'Double laser':null,art&2?'Triple laser':null].filter(Boolean)};
 }
 function decode(code){return mode()==='doom64'?decodeD64(code):decodeClassic(code);}
 function render(data){
  $('level').textContent=`${data.level}${data.levelName?' · '+data.levelName:''}`;$('skill').textContent=data.skills[data.skill];$('health').textContent=`${data.health}%`;
  $('armor').textContent=`${data.armor}%`;$('armorType').textContent=data.armorType;$('backpack').textContent=data.backpack?'Yes':'No';
  $('weapons').innerHTML=data.weapons.length?data.weapons.map(w=>`<span class="chip">${w}</span>`).join(''):'<span class="empty">No additional weapons</span>';
  $('ammo').innerHTML=[['Bullets',data.ammo[0]],['Shells',data.ammo[1]],['Rockets',data.ammo[2]],['Energy cells',data.ammo[3]]].map(([n,v])=>`<div class="ammo-line"><span>${n}</span><b>${v}</b></div>`).join('');
  $('artifactStat').hidden=!data.artifacts;$('artifacts').textContent=data.artifacts?.length?data.artifacts.join(', '):'None';$('result').classList.add('show');
 }
 function encodeClassic(){
  const level=readInt('gLevel'),skill=readChoice('gSkill'),health=readInt('gHealth'),armor=readInt('gArmor'),armorType=readChoice('gArmorType'),backpack=$('gBackpack').checked,msg=$('genMessage'),max=mode()==='final'?29:59;
  if(level<1||level>max||level===54||health<1||health>200||armor<0||armor>200){msg.className='msg error';msg.textContent=`Check the values. Valid levels are 1–${mode()==='final'?'29':'59, except 54'}.`;return;}
  if(armor>0&&armorType===0){msg.className='msg error';msg.textContent='Choose Green or Blue armor when armor is above 0%.';return;}
  const mul=backpack?2:1,clip=quantize(readInt('gBullets'),200*mul),shell=quantize(readInt('gShells'),50*mul),rocket=quantize(readInt('gRockets'),50*mul),cell=quantize(readInt('gCells'),300*mul);
  let weaponBits=backpack?128:0;for(let i=0;i<7;i++)if($(`gWeapon${i}`).checked)weaponBits|=1<<i;
  const bytes=[(level<<2)|skill,weaponBits,(clip<<4)|shell,(cell<<4)|rocket,(quantize(health,200)<<4)|quantize(armor,200),armorType<<3],groups=[];
  for(let start=0;start<45;start+=5){let val=0;for(let j=0;j<5;j++){const b=start+j;val=(val<<1)|((bytes[Math.floor(b/8)]&(0x80>>(b%8)))?1:0);}groups.push(val);}
  let checksum=0;for(const val of groups)checksum^=val;const password=groups.map(val=>alphabet[val^checksum]).join('')+alphabet[checksum];
  $('generated').innerHTML=`${password.toUpperCase()}<small>Password for level ${level} · ${skillNames[skill]}</small>`;$('generated').classList.add('show');$('password').value=password;render(decodeClassic(password));
  $('message').textContent='Generated password copied into the decoder field.';$('message').className='msg ok';msg.className='msg ok';msg.textContent='Password generated locally.';
 }
 function encodeD64(){
  const level=readInt('d64Level'),skill=readChoice('d64Skill'),health=readInt('d64Health'),armor=readInt('d64Armor'),armorType=readChoice('d64ArmorType'),backpack=$('d64Backpack').checked,msg=$('d64GenMessage');
  if(level<1||level>32||health<0||health>200||armor<0||armor>200||(armor>0&&armorType===0)){msg.className='msg error';msg.textContent='Check the level, health, armor type, and armor values.';return;}
  const multiplier=backpack?2:1;let weapons=0;
  for(let i=0;i<8;i++)if($(`d64Weapon${i}`).checked)weapons|=1<<i;
  const clip=quantize(readInt('d64Bullets'),200*multiplier),shell=quantize(readInt('d64Shells'),50*multiplier),rocket=quantize(readInt('d64Rockets'),50*multiplier),cell=quantize(readInt('d64Cells'),300*multiplier);
  let artifacts=($('d64Fast').checked?1:0)|($('d64Triple').checked?2:0)|($('d64Double').checked?4:0);
  const bytes=[(level<<2)|skill,weapons,(clip<<4)|shell,(cell<<4)|rocket,(quantize(health,200)<<4)|quantize(armor,200),armorType|(artifacts<<2)|(backpack?128:0),0,0,0,0];
  const words=[(bytes[0]<<8)|bytes[1],(bytes[2]<<8)|bytes[3],(bytes[4]<<8)|bytes[5]],sum=(~(words[0]+words[1]+words[2]))&0xffff,xor=(~(words[0]^words[1]^words[2]))&0xffff;
  bytes[6]=sum>>>8;bytes[7]=sum&255;bytes[8]=xor>>>8;bytes[9]=xor&255;
  for(let i=0;i<10;i++)bytes[i]^=bytes[d64PasswordTable[i]];
  let out='';for(let start=0;start<80;start+=5){let val=0;for(let j=0;j<5;j++){const b=start+j;val=(val<<1)|((bytes[b>>3]&(0x80>>(b&7)))?1:0);}out+=d64Alphabet[val];}
  const password=out.match(/.{1,4}/g).join(' ').toUpperCase(),data=decodeD64(out);
  $('d64Generated').innerHTML=`${password}<small>DOOM 64 · ${data.levelName} · ${d64Skills[skill]}</small>`;$('d64Generated').classList.add('show');$('password').value=password;render(data);
  $('message').textContent='Generated DOOM 64 password copied into the decoder field.';$('message').className='msg ok';msg.className='msg ok';msg.textContent='Password generated locally.';
 }
 function updateMode(){
  const d64=mode()==='doom64',final=mode()==='final';$('encodeForm').hidden=d64;$('d64EncodeForm').hidden=!d64;
  $('generatorIntro').textContent=d64?'Set the state restored by a Nintendo 64 password. Stats and ammo round up to the original game’s fixed steps.':'Set the state to restore. Ammo, health, and armor are rounded to the game’s password increments.';
  $('gLevel').max=final?'29':'59';$('gLevel').previousElementSibling.textContent=final?'Level (1–29)':'Level (1–59, except 54)';
  $('password').maxLength=d64?19:10;$('password').placeholder=d64?'W83M 7H20 BCY0 PSVB':'VBVXVVXVVV';$('password').value='';$('result').classList.remove('show');$('artifactStat').hidden=true;
  $('message').className='msg';$('message').textContent=d64?'DOOM 64 password: 16 characters · valid characters include ?':'Valid characters: b c d f g h j k l m n p q r s t v w x y z 0–9 and !';
  $('generated').classList.remove('show');$('d64Generated').classList.remove('show');$('genMessage').textContent='';$('d64GenMessage').textContent='';
 }
 document.querySelectorAll('input[name="gameMode"]').forEach(input=>input.addEventListener('change',updateMode));
 $('password').addEventListener('input',e=>{const chars=mode()==='doom64'?d64Alphabet:alphabet,limit=mode()==='doom64'?16:10,clean=e.target.value.toLowerCase().replace(/\s/g,'').split('').filter(ch=>chars.includes(ch)).join('').slice(0,limit);if(clean!==e.target.value.toLowerCase().replace(/\s/g,'').slice(0,limit))e.target.value=clean;});
 function keepFormInPlace(form,action){const top=form.getBoundingClientRect().top;action();requestAnimationFrame(()=>{const shift=form.getBoundingClientRect().top-top;if(Math.abs(shift)>1)window.scrollBy(0,shift);});}
 $('encodeForm').addEventListener('submit',e=>{e.preventDefault();keepFormInPlace(e.currentTarget,encodeClassic);});
 $('d64EncodeForm').addEventListener('submit',e=>{e.preventDefault();keepFormInPlace(e.currentTarget,encodeD64);});
 const ammoKinds=[['Bullets',200],['Shells',50],['Rockets',50],['Cells',300]];
 function updateAmmoLimits(prefix){const factor=$(`${prefix}Backpack`).checked?2:1;for(const [name,base] of ammoKinds){const input=$(`${prefix}${name}`),limit=base*factor;input.max=limit;input.previousElementSibling.textContent=`${name} (0–${limit})`;if(Number(input.value)>limit)input.value=limit;}}
 const setAmmo=(prefix,fill)=>{const max=$(`${prefix}Backpack`).checked?2:1;$(`${prefix}Bullets`).value=fill?200*max:50;$(`${prefix}Shells`).value=fill?50*max:0;$(`${prefix}Rockets`).value=fill?50*max:0;$(`${prefix}Cells`).value=fill?300*max:0;};
 $('gBackpack').addEventListener('change',()=>updateAmmoLimits('g'));$('d64Backpack').addEventListener('change',()=>updateAmmoLimits('d64'));
 $('gMaxAmmo').addEventListener('click',()=>setAmmo('g',true));$('gResetAmmo').addEventListener('click',()=>setAmmo('g',false));
 $('d64MaxAmmo').addEventListener('click',()=>setAmmo('d64',true));$('d64ResetAmmo').addEventListener('click',()=>setAmmo('d64',false));
 const setChoice=(name,value)=>{const input=document.querySelector(`input[name="${name}"][value="${value}"]`);if(input)input.checked=true;};
 const maxHealthArmor=prefix=>{$(`${prefix}Health`).value=200;$(`${prefix}Armor`).value=200;setChoice(`${prefix}ArmorType`,2);};
 $('gMaxHealth').addEventListener('click',()=>maxHealthArmor('g'));
 $('d64MaxHealth').addEventListener('click',()=>maxHealthArmor('d64'));
 $('giveAll').addEventListener('click',()=>{for(let i=0;i<7;i++)$(`gWeapon${i}`).checked=true;$('gBackpack').checked=true;updateAmmoLimits('g');$('gHealth').value=200;$('gArmor').value=200;setChoice('gArmorType',2);$('gBullets').value=400;$('gShells').value=100;$('gRockets').value=100;$('gCells').value=600;});
 $('resetGen').addEventListener('click',()=>{$('encodeForm').reset();updateAmmoLimits('g');$('generated').classList.remove('show');$('genMessage').textContent='Settings reset.';});
 $('d64GiveAll').addEventListener('click',()=>{for(let i=0;i<8;i++)$(`d64Weapon${i}`).checked=true;$('d64Backpack').checked=true;updateAmmoLimits('d64');$('d64Health').value=200;$('d64Armor').value=200;setChoice('d64ArmorType',2);$('d64Bullets').value=400;$('d64Shells').value=100;$('d64Rockets').value=100;$('d64Cells').value=600;$('d64Fast').checked=$('d64Double').checked=$('d64Triple').checked=true;});
 $('d64Reset').addEventListener('click',()=>{$('d64EncodeForm').reset();updateAmmoLimits('d64');$('d64Generated').classList.remove('show');$('d64GenMessage').textContent='Settings reset.';});
 $('decodeForm').addEventListener('submit',e=>{e.preventDefault();const msg=$('message');try{render(decode($('password').value));msg.className='msg ok';msg.textContent='Valid password. These are the values the game will restore.';}catch(err){$('result').classList.remove('show');msg.className='msg error';msg.textContent=err.message;}});
 updateMode();updateAmmoLimits('g');updateAmmoLimits('d64');
})();
