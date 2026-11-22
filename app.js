// Configure with your authenticated API host. Never put GitHub tokens here.
const API = "https://YOUR-WORKER-DOMAIN.example.com";
// Scan these repositories recursively through the authenticated API.
const REPOSITORIES = ["memories-archive-001", "memories-archive-002"];
const $ = s => document.querySelector(s);
let mode="photos", data={photo:[],video:[]}, cursors={photo:null,video:null}, current=[], currentIndex=0;
const qs = o => {const p=new URLSearchParams();Object.entries(o).forEach(([k,v])=>{if(v!==""&&v!=null)p.set(k,v)});return p.toString()};
function say(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function showLogin(){ $("#loginView").hidden=false;$("#appView").hidden=true }
function showApp(){ $("#loginView").hidden=true;$("#appView").hidden=false }
async function api(path,options={}){const r=await fetch(API+path,{credentials:"include",...options});if(r.status===401){showLogin();throw Error("Sign in to view your private library.")}if(!r.ok)throw Error(`API request failed (${r.status})`);return r}
function url(item,kind="photo",thumb=true){return `${API}/api/${kind==="video"&&!thumb?"video":"image"}?${qs({repo:item.repo,path:thumb?(item.thumbnail||item.poster||item.path):item.path})}`}
function dateLabel(x){return x.date||[x.year,x.month].filter(Boolean).join(" · ")||""}
function safe(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function filters(){return {year:$("#year").value,month:$("#month").value,repo:$("#repo").value,repos:REPOSITORIES.join(",")}}
async function options(){
  const [y]=await Promise.all([
    api(`/api/years?${qs({repos:REPOSITORIES.join(",")})}`)
  ]);
  for(const v of (await y.json()).years||[])$("#year").add(new Option(v,v));
  for(const v of REPOSITORIES)$("#repo").add(new Option(v,v));
}
async function load(kind,reset=false){if(reset){data[kind]=[];cursors[kind]=null}const result=await (await api(`/api/media?${qs({kind,...filters(),cursor:cursors[kind],limit:60})}`)).json();data[kind].push(...(result.items||[]).map(x=>({...x,kind})));cursors[kind]=result.nextCursor||null;kind==="photo"?renderPhotos():renderVideos()}
function visible(kind){const q=$("#search").value.trim().toLowerCase();return data[kind].filter(x=>!q||`${x.path} ${x.repo} ${x.date||""}`.toLowerCase().includes(q))}
function renderPhotos(){const list=visible("photo"),wall=$("#photoWall");wall.replaceChildren();$("#photoCount").textContent=`${list.length.toLocaleString()} loaded`;list.forEach((x,i)=>{const b=document.createElement("button");b.className="photo-card";b.type="button";const img=document.createElement("img");img.loading="lazy";img.decoding="async";img.src=url(x);img.alt=x.path;const meta=document.createElement("div");meta.className="photo-meta";meta.innerHTML=`<span>${safe(dateLabel(x))}</span><span>${safe(x.repo)}</span>`;b.append(img,meta);b.onclick=()=>openPhoto(list,i);wall.append(b)});$("#photoMore").hidden=!cursors.photo}
function renderVideos(){const list=visible("video"),root=$("#videoShelves");root.replaceChildren();$("#videoCount").textContent=`${list.length.toLocaleString()} loaded`;const groups=new Map();list.forEach(x=>{const key=String(x.year||x.date||"Videos").slice(0,4);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x)});for(const [year,items] of groups){const section=document.createElement("section");section.className="video-shelf";const h=document.createElement("h3");h.textContent=year;const row=document.createElement("div");row.className="video-row";for(const x of items){const card=document.createElement("article");card.className="video-card";card.tabIndex=0;card.setAttribute("role","button");const poster=x.poster||x.thumbnail;const p=poster?url({...x,thumbnail:poster},"video",true):"";const back=document.createElement("div");back.className="video-backdrop";if(p)back.style.backgroundImage=`url("${p}")`;const img=document.createElement("img");img.className="video-poster";img.loading="lazy";img.alt="";if(p)img.src=p;const play=document.createElement("span");play.className="play";play.textContent="▶";const title=document.createElement("span");title.className="video-title";title.textContent=x.title||x.path.split("/").pop();card.append(back,img,play,title);if(x.duration){const d=document.createElement("span");d.className="duration";d.textContent=x.duration;card.append(d)}const open=()=>openVideo(x);card.onclick=open;card.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}};row.append(card)}section.append(h,row);root.append(section)}$("#videoMore").hidden=!cursors.video}
function openPhoto(list,i){current=list;currentIndex=i;showPhoto(i);$("#photoViewer").showModal()}
function showPhoto(i){currentIndex=(i+current.length)%current.length;const x=current[currentIndex];$("#bigPhoto").src=url(x,"photo",false);$("#bigPhoto").alt=x.path;$("#photoCaption").textContent=`${dateLabel(x)} · ${x.repo} · ${x.path}`}
async function openVideo(x){const v=$("#player");v.pause();v.src=url(x,"video",false);v.load();$("#videoCaption").textContent=`${dateLabel(x)} · ${x.repo} · ${x.path}`;$("#videoViewer").showModal();try{await v.play()}catch{}}
async function refresh(){try{await Promise.all([load("photo",true),load("video",true)])}catch(e){say(e.message)}}
function setMode(m){
  mode=m;
  document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===m));
  $("#photoSection").hidden=m==="videos";
  $("#videoSection").hidden=m==="photos";
  $("#pageTitle").innerHTML=m==="videos"?"Moving moments,<br><em>replayed.</em>":"Little moments,<br><em>kept forever.</em>";
}
$("#loginButton").onclick=()=>location.href=API+"/auth/login";
$("#logout").onclick=async()=>{try{await api("/auth/logout",{method:"POST"})}catch{}showLogin()};
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
["year","month","repo"].forEach(id=>$("#"+id).onchange=refresh);
$("#search").oninput=()=>{renderPhotos();renderVideos()};
$("#photoMore").onclick=()=>load("photo").catch(e=>say(e.message));$("#videoMore").onclick=()=>load("video").catch(e=>say(e.message));
$("#prev").onclick=()=>showPhoto(currentIndex-1);$("#next").onclick=()=>showPhoto(currentIndex+1);
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>{if(b.dataset.close==="videoViewer")$("#player").pause();$("#"+b.dataset.close).close()});
$("#videoViewer").addEventListener("close",()=>{$("#player").pause();$("#player").removeAttribute("src");$("#player").load()});
document.addEventListener("keydown",e=>{if($("#photoViewer").open&&e.key==="ArrowLeft")showPhoto(currentIndex-1);if($("#photoViewer").open&&e.key==="ArrowRight")showPhoto(currentIndex+1)});
(async()=>{try{const me=await(await api("/api/me")).json();if(me.login&&me.login!=="SadGuy0")throw Error("This gallery is restricted to the owner account.");showApp();await options();await Promise.all([load("photo",true),load("video",true)])}catch(e){showLogin();if(!e.message.includes("401"))say(e.message)}})();
