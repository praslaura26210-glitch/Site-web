const fs=require('fs');const [,,npm,inF,outF]=process.argv;
const wawoff=require(npm+'/wawoff2-2.0.1/package/index.js');
const opentype=require(npm+'/opentype.js-1.3.4/package/dist/opentype.js');
(async()=>{const ttf=await wawoff.decompress(fs.readFileSync(inF));
const f=opentype.parse(ttf.buffer.slice(ttf.byteOffset,ttf.byteOffset+ttf.byteLength));
const scale=1000/f.unitsPerEm, glyphs={};
for(const ch of 'PILATESpilates0123456789 '){const g=f.charToGlyph(ch);let o='';
 for(const c of g.path.commands){const r=v=>Math.round(v*scale);
  if(c.type==='M')o+=`m ${r(c.x)} ${r(c.y)} `;else if(c.type==='L')o+=`l ${r(c.x)} ${r(c.y)} `;
  else if(c.type==='Q')o+=`q ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} `;
  else if(c.type==='C')o+=`b ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} `;}
 glyphs[ch]={ha:Math.round(g.advanceWidth*scale),x_min:0,x_max:0,o};}
fs.writeFileSync(outF,JSON.stringify({glyphs,familyName:'Mont',ascender:Math.round(f.ascender*scale),descender:Math.round(f.descender*scale),underlinePosition:-100,underlineThickness:50,boundingBox:{yMin:-200,xMin:0,yMax:1000,xMax:1000},resolution:1000,original_font_information:{}}));
console.log('ok',Object.keys(glyphs).length)})();
