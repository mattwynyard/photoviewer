(this.webpackJsonpclient=this.webpackJsonpclient||[]).push([[0],{66:function(e,t,a){e.exports=a(84)},73:function(e,t,a){},75:function(e,t,a){},76:function(e,t){},84:function(e,t,a){"use strict";a.r(t);var n=a(0),o=a.n(n),r=a(17),s=a.n(r),i=(a(71),a(72),a(73),a(10)),l=a.n(i),c=a(31),u=a(32),h=a(36),m=a(33),d=a(37),p=a(100),v=a(99),f=a(87),g=a(89),y=a(90),k=a(91),E=a(102),b=a(98),w=a(97),C=a(94),L=a(96),S=a(88),x=a(93),j=a(101),N=a(92),z=a(61),_=a(95),T=a(6),P=a.n(T),A=(a(75),a(76),function(e){function t(e){var a;return Object(c.a)(this,t),(a=Object(h.a)(this,Object(m.a)(t).call(this,e))).setTitle=function(e){a.setState({title:e})},a.state={title:"Login",onClick:null},a}return Object(d.a)(t,e),Object(u.a)(t,[{key:"setOnClick",value:function(e){this.setState({onClick:e})}},{key:"componentDidMount",value:function(){}},{key:"componentWillUnmount",value:function(){}},{key:"render",value:function(){return"Login"===this.state.title?o.a.createElement(w.a,{className:"ml-auto"},o.a.createElement(w.a.Link,{id:"Login",href:"#login",onClick:this.state.onClick},this.state.title," ")):o.a.createElement(w.a,{className:"ml-auto"},o.a.createElement(C.a,{className:"navdropdown",title:this.state.title,id:"basic-nav-dropdown"},o.a.createElement(C.a.Item,{className:"navdropdownitem",href:"#login",onClick:this.state.onClick},"Logout")))}}]),t}(o.a.Component));P.a.DomUtil.setTransform=P.a.DomUtil.setTransform||function(e,t,a){var n=t||new P.a.Point(0,0);e.style[P.a.DomUtil.TRANSFORM]=(P.a.Browser.ie3d?"translate("+n.x+"px,"+n.y+"px)":"translate3d("+n.x+"px,"+n.y+"px,0)")+(a?" scale("+a+")":"")};var D=function(e){function t(){return Object(c.a)(this,t),Object(h.a)(this,Object(m.a)(t).apply(this,arguments))}return Object(d.a)(t,e),Object(u.a)(t,[{key:"initialize",value:function(e){this._map=null,this._canvas=null,this._frame=null,this._delegate=null,P.a.setOptions(this,e)}},{key:"delegate",value:function(e){return this._delegate=e,this}},{key:"needRedraw",value:function(){return this._frame||(this._frame=P.a.Util.requestAnimFrame(this.drawLayer,this)),this}},{key:"_onLayerDidResize",value:function(e){this._canvas.width=e.newSize.x,this._canvas.height=e.newSize.y}},{key:"_onLayerDidMove",value:function(){var e=this._map.containerPointToLayerPoint([0,0]);P.a.DomUtil.setPosition(this._canvas,e),this.drawLayer()}},{key:"getEvents",value:function(){var e={resize:this._onLayerDidResize,moveend:this._onLayerDidMove,zoom:this._onLayerDidMove};return this._map.options.zoomAnimation&&P.a.Browser.any3d&&(e.zoomanim=this._animateZoom),e}},{key:"onAdd",value:function(e){this._map=e,this._canvas=P.a.DomUtil.create("canvas","leaflet-layer"),this.tiles={};var t=this._map.getSize();this._canvas.width=t.x,this._canvas.height=t.y;var a=this._map.options.zoomAnimation&&P.a.Browser.any3d;P.a.DomUtil.addClass(this._canvas,"leaflet-zoom-"+(a?"animated":"hide")),e._panes.overlayPane.appendChild(this._canvas),e.on(this.getEvents(),this);var n=this._delegate.state||this.state;n.onLayerDidMount&&n.onLayerDidMount(),this.needRedraw()}},{key:"onRemove",value:function(e){var t=this._delegate||this;t.onLayerWillUnmount&&t.onLayerWillUnmount(),e.getPanes().overlayPane.removeChild(this._canvas),e.off(this.getEvents(),this),this._canvas=null}},{key:"addTo",value:function(e){return e.addLayer(this),this}},{key:"LatLonToMercator",value:function(e){return{x:6378137*e.lng*Math.PI/180,y:6378137*Math.log(Math.tan((90+e.lat)*Math.PI/360))}}},{key:"drawLayer",value:function(){var e=this._map.getSize(),t=this._map.getBounds(),a=this._map.getZoom(),n=this.LatLonToMercator(this._map.getCenter()),o=this.LatLonToMercator(this._map.containerPointToLatLng(this._map.getSize())),r=this._delegate.state||this.state,s={points:this._delegate.props.points,layer:this,canvas:this._canvas,bounds:t,size:e,zoom:a,center:n,corner:o};this._delegate.state.info=s,r.onDrawLayer&&r.onDrawLayer(s),this._frame=null}},{key:"_setTransform",value:function(e,t,a){var n=t||new P.a.Point(0,0);e.style[P.a.DomUtil.TRANSFORM]=(P.a.Browser.ie3d?"translate("+n.x+"px,"+n.y+"px)":"translate3d("+n.x+"px,"+n.y+"px,0)")+(a?" scale("+a+")":"")}},{key:"_animateZoom",value:function(e){var t=this._map.getZoomScale(e.zoom),a=P.a.Layer?this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(),e.zoom,e.center).min:this._map._getCenterOffset(e.center)._multiplyBy(-t).subtract(this._map._getMapPanePos());P.a.DomUtil.setTransform(this._canvas,a,t)}}]),t}(T.Layer),F=a(21),O=a.n(F),M=function(e){function t(e){var a;return Object(c.a)(this,t),(a=Object(h.a)(this,Object(m.a)(t).call(this,e))).callBackendAPI=function(){var e,t;return l.a.async((function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=2,l.a.awrap(fetch("http://"+a.state.host+"/api"));case 2:return e=n.sent,n.next=5,l.a.awrap(e.json());case 5:if(t=n.sent,console.log(t.express),200===e.status){n.next=10;break}throw alert(t),Error(t.message);case 10:return n.abrupt("return",t);case 11:case"end":return n.stop()}}))},a.customNav=o.a.createRef(),a.state={location:{lat:-41.2728,lng:173.2995},host:a.getHost(),token:O.a.get("token"),login:a.getUser(),loginModal:a.getLoginModal(a.getUser()),zIndex:900,osmThumbnail:"satellite64.png",mode:"map",zoom:8,index:null,centreData:[],objData:[],fault:[],priority:[],sizes:[],photos:[],currentPhoto:null,currentFault:[],layers:[],bounds:{},icon:a.getCustomIcon(),show:!1,showLogin:!1,showContact:!1,showTerms:!1,showAbout:!1,modalPhoto:null,popover:!1,filterModal:!1,activeSelection:"Fault Type",photourl:null,amazon:null,user:a.getUser(),password:null,projectArr:a.getProjects(),faultClass:[],faultTypes:[],pageActive:0,checkedFaults:[],checked:!1,activeProject:null,activeLayers:[],clearDisabled:!0},a}return Object(d.a)(t,e),Object(u.a)(t,[{key:"getHost",value:function(){return"osmium.nz"}},{key:"componentDidMount",value:function(){this.customNav.current.setTitle(this.state.user),this.customNav.current.setOnClick(this.state.loginModal),this.callBackendAPI().catch((function(e){return alert(e)}));var e=this.map.leafletElement;P.a.canvasLayer=function(){return new D};var t=P.a.canvasLayer().delegate(this).addTo(e)._canvas,a=t.getContext("experimental-webgl",{antialias:!0})||t.getContext("experimental-webgl");a&&console.log("gl: "+a.canvas.width+" "+a.canvas.height)}},{key:"componentDidUpdate",value:function(){}},{key:"getProjects",value:function(){var e=O.a.get("projects");return void 0===e?[]:JSON.parse(e)}},{key:"getUser",value:function(){var e=O.a.get("user");return void 0===e?"Login":e}},{key:"getLoginModal",value:function(e){var t=this;return"Login"===e?function(e){return t.clickLogin(e)}:function(e){return t.logout(e)}}},{key:"getCustomIcon",value:function(e,t){var a=this.getSize(t);return"5"===e?P.a.icon({iconUrl:"CameraSpringGreen_16px.png",iconSize:[a,a],iconAnchor:[a/2,a/2]}):"4"===e?P.a.icon({iconUrl:"CameraOrange_16px.png",iconSize:[a,a],iconAnchor:[a/2,a/2]}):"3"===e?P.a.icon({iconUrl:"CameraLemon_16px.png",iconSize:[a,a],iconAnchor:[a/2,a/2]}):P.a.icon({iconUrl:"CameraSpringGreen_16px.png",iconSize:[a,a],iconAnchor:[a/2,a/2]})}},{key:"getSize",value:function(e){return e<10?4:e>=10&&e<=14?10:e>14&&e<=16?16:e>16&&e<=18?20:32}},{key:"addMarkers",value:function(e){var t,a,n,o,r,s,i;return l.a.async((function(l){for(;;)switch(l.prev=l.next){case 0:for(t=[],a=0;a<e.length;a++)({}),o=JSON.parse(e[a].st_asgeojson),r=o.coordinates[0],s=o.coordinates[1],i=P.a.latLng(s,r),n={roadid:e[a].roadid,carriage:e[a].carriagewa,location:e[a].location,fault:e[a].fault,size:e[a].size,priority:e[a].priority,photo:e[a].photoid,datetime:e[a].faulttime,latlng:i},t.push(n);this.setState({objData:t});case 3:case"end":return l.stop()}}),null,this)}},{key:"addCentrelines",value:function(e){var t=[];console.log(e.length);for(var a=0;a<e.length;a++){var n=JSON.parse(e[a].st_asgeojson);if(null!==n)for(var o=[],r=n.coordinates[0],s=0;s<r.length;s++){var i=r[s],l=P.a.latLng(i[1],i[0]);o.push(l)}t.push(o)}this.setState({centreData:t})}},{key:"onZoom",value:function(e){this.setState({zoom:e.target.getZoom()}),this.setState({bounds:e.target.getBounds()})}},{key:"toogleMap",value:function(e){"map"===this.state.mode?(this.setState({zIndex:1e3}),this.setState({mode:"sat"}),this.setState({osmThumbnail:"map64.png"})):(this.setState({zIndex:900}),this.setState({mode:"map"}),this.setState({osmThumbnail:"satellite64.png"}))}},{key:"clickImage",value:function(e){this.setState({show:!0});var t=this.getFault(this.state.index,"photo");this.setState({currentPhoto:t})}},{key:"getPhoto",value:function(e){var t=this.state.currentPhoto,a=parseInt(t.slice(t.length-5,t.length)),n=null;n="prev"===e?a-1:a+1;var o=this.pad(n,5),r=t.slice(0,t.length-5)+o;return this.setState({currentPhoto:r}),r}},{key:"clickPrev",value:function(e){var t=this.getPhoto("prev");console.log(t),this.setState({currentPhoto:t});var a=this.state.amazon+t+".jpg";this.setState({photourl:a})}},{key:"clickNext",value:function(e){var t=this.getPhoto("next");this.setState({currentPhoto:t});var a=this.state.amazon+t+".jpg";this.setState({photourl:a})}},{key:"clickMarker",value:function(e){var t=e.target.options.index;this.setState({index:t}),this.setState({popover:!0})}},{key:"clearCache",value:function(){var e=this;O.a.remove("token"),O.a.remove("user"),O.a.remove("projects"),this.setState({login:"Login"}),this.customNav.current.setOnClick((function(t){return e.clickLogin(t)})),this.customNav.current.setTitle("Login"),this.setState({activeProject:null}),this.setState({projectArr:[]}),this.setState({checkedFaults:[]}),this.setState({objData:[]})}},{key:"logout",value:function(e){var t,a;return l.a.async((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,l.a.awrap(fetch("http://"+this.state.host+"/logout",{method:"POST",credentials:"same-origin",headers:{authorization:this.state.token,Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({user:this.state.login})}));case 2:return t=e.sent,e.next=5,l.a.awrap(t.json());case 5:if(a=e.sent,200===t.status){e.next=8;break}throw Error(a.message);case 8:this.clearCache();case 9:case"end":return e.stop()}}),null,this)}},{key:"login",value:function(e){var t,a,n=this;return l.a.async((function(e){for(;;)switch(e.prev=e.next){case 0:return this.setState({showLogin:!1}),e.next=3,l.a.awrap(fetch("http://"+this.state.host+"/login",{method:"POST",credentials:"same-origin",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({user:this.userInput.value,key:this.passwordInput.value})}));case 3:return t=e.sent,e.next=6,l.a.awrap(t.json());case 6:if(a=e.sent,console.log(a),200===t.status){e.next=10;break}throw Error(a.message);case 10:a.result?(console.log("user: "+a.user+" Login succeded"),O.a.set("token",a.token,{expires:7}),O.a.set("user",a.user,{expires:7}),this.setState({login:a.user}),this.setState({token:a.token}),this.buildProjects(a.projects),this.customNav.current.setTitle(a.user),this.customNav.current.setOnClick((function(e){return n.logout(e)}))):console.log(a.error);case 11:case"end":return e.stop()}}),null,this)}},{key:"buildProjects",value:function(e){for(var t=[],a=0;a<e.length;a+=1)t.push(e[a]);O.a.set("projects",JSON.stringify(t),{expires:7}),this.setState({projectArr:t})}},{key:"loadLayer",value:function(e){this.setState({activeProject:e.target.attributes.code.value});for(var t=0;t<this.state.projectArr.length;t+=1)if(this.state.projectArr[t].code===e.target.attributes.code.value){var a={code:this.state.projectArr[t].code,description:this.state.projectArr[t].description,date:this.state.projectArr[t].date};this.setState({amazon:this.state.projectArr[t].amazon}),this.state.activeLayers.push(a)}this.filterLayer(e.target.attributes.code.value)}},{key:"removeLayer",value:function(e){console.log(e.target.attributes.code.value),console.log(this.state.activeLayers);for(var t=this.state.activeLayers,a=0;a<t.length;a+=1)if(e.target.attributes.code.value===t[a].code){console.log(t[a]),t.splice(a,1);break}this.setState({activeLayers:t})}},{key:"filterLayer",value:function(e){var t,a;return l.a.async((function(n){for(;;)switch(n.prev=n.next){case 0:if("Login"===this.state.login){n.next=12;break}return n.next=3,l.a.awrap(fetch("http://"+this.state.host+"/layer",{method:"POST",headers:{authorization:this.state.token,Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({user:this.state.login,project:e,filter:this.state.checkedFaults})}));case 3:return 200!==(t=n.sent).status&&console.log(t.status),n.next=7,l.a.awrap(t.json());case 7:return a=n.sent,n.next=10,l.a.awrap(this.addMarkers(a));case 10:n.next=12;break;case 12:case"end":return n.stop()}}),null,this)}},{key:"submitFilter",value:function(e){this.setState({filterModal:!1}),this.filterLayer(this.state.activeProject)}},{key:"loadCentreline",value:function(e){var t,a;return l.a.async((function(n){for(;;)switch(n.prev=n.next){case 0:if("Login"===this.state.login){n.next=12;break}return n.next=3,l.a.awrap(fetch("http://"+this.state.host+"/roads",{method:"POST",headers:{authorization:this.state.token,Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({code:"900",menu:e.target.id,user:this.state.login})}));case 3:return 200!==(t=n.sent).status&&console.log(t.status),n.next=7,l.a.awrap(t.json());case 7:return a=n.sent,n.next=10,l.a.awrap(this.addCentrelines(a));case 10:n.next=12;break;case 12:case"end":return n.stop()}}),null,this)}},{key:"loadFilters",value:function(){var e,t;return l.a.async((function(a){for(;;)switch(a.prev=a.next){case 0:if("Login"===this.state.login){a.next=10;break}return a.next=3,l.a.awrap(fetch("http://"+this.state.host+"/class",{method:"POST",headers:{authorization:this.state.token,Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({user:this.state.login})}));case 3:return 200!==(e=a.sent).status&&console.log(e.status),a.next=7,l.a.awrap(e.json());case 7:t=a.sent,this.setState({faultClass:t}),this.getFaultTypes(this.state.faultClass[0].code);case 10:case"end":return a.stop()}}),null,this)}},{key:"getFaultTypes",value:function(e){var t,a;return l.a.async((function(n){for(;;)switch(n.prev=n.next){case 0:if("Login"===this.state.login){n.next=10;break}return n.next=3,l.a.awrap(fetch("http://"+this.state.host+"/faults",{method:"POST",headers:{authorization:this.state.token,Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({user:this.state.login,type:e})}));case 3:return 200!==(t=n.sent).status&&console.log(t.status),n.next=7,l.a.awrap(t.json());case 7:(a=n.sent).map((function(t){return t.type=e})),this.setState({faultTypes:a});case 10:case"end":return n.stop()}}),null,this)}},{key:"clickLogin",value:function(e){this.setState({showLogin:!0})}},{key:"clickAbout",value:function(e){this.setState({showAbout:!0})}},{key:"clickTerms",value:function(e){this.setState({showTerms:!0})}},{key:"clickContact",value:function(e){this.setState({showContact:!0})}},{key:"clickClose",value:function(e){this.setState({showContact:!1}),this.setState({showAbout:!1}),this.setState({showTerms:!1})}},{key:"clickPage",value:function(e){this.setState({pageActive:e}),this.getFaultTypes(this.state.faultClass[e].code)}},{key:"changeCheck",value:function(e){var t=this.state.checkedFaults;if(e.target.checked)t.push(e.target.id);else for(var a=0;a<t.length;a+=1)if(e.target.id===t[a]){t.splice(a,1);break}this.setState({checkedFaults:t})}},{key:"isChecked",value:function(e){for(var t=0;t<this.state.checkedFaults.length;t+=1)if(e===this.state.checkedFaults[t])return!0;return!1}},{key:"closeModal",value:function(){this.setState({show:!1}),this.setState({popover:!1})}},{key:"clickFilter",value:function(e){this.setState({index:null}),this.setState({filterModal:!0}),this.loadFilters()}},{key:"clearFilter",value:function(e){this.setState({checkedFaults:[]})}},{key:"pad",value:function(e,t,a){return a=a||"0",(e+="").length>=t?e:new Array(t-e.length+1).join(a)+e}},{key:"getColor",value:function(){return"#"+Math.random().toString(16).substr(-6)}},{key:"getFault",value:function(e,t){if(0===this.state.objData.length||null===e)return null;switch(t){case"fault":return this.state.objData[e].fault;case"priority":return this.state.objData[e].priority;case"location":return this.state.objData[e].location;case"size":return this.state.objData[e].size;case"datetime":return this.state.objData[e].datetime;case"photo":return this.state.objData[e].photo;default:return null}}},{key:"tableLoad",value:function(e){console.log(e.target)}},{key:"closePhotoModal",value:function(e){this.setState({show:!1})}},{key:"clickGroup",value:function(e){console.log("click")}},{key:"render",value:function(){var e=this,t=[this.state.location.lat,this.state.location.lng],a=this.state.fault.fault,n=this.state.photos.photo,r=function(e){var t=e.projects;e.onClick;return void 0===t?o.a.createElement(C.a.Item,{title:e.title,className:"dropdownitem"},"Add Layers"):0===t.length?o.a.createElement(C.a.Item,{title:e.title,className:"dropdownitem"},"Add Layers"):o.a.createElement(C.a,{title:e.title,className:"navdropdownitem",drop:"right"},e.projects.map((function(t,a){return o.a.createElement(C.a.Item,{className:"navdropdownitem",key:"".concat(a),index:a,title:t.code,code:t.code,onClick:e.onClick},t.description+" "+t.date)})),o.a.createElement(C.a.Divider,null))};return o.a.createElement(o.a.Fragment,null,o.a.createElement("div",null,o.a.createElement(L.a,{bg:"light",expand:"lg"},o.a.createElement(L.a.Brand,{href:"#home"},o.a.createElement("img",{src:"logo.png",width:"122",height:"58",className:"d-inline-block align-top",alt:"logo"})),o.a.createElement((function(e){var t=this,a=e.loadLayer,n=e.clickFilter,s=e.removeLayer;return null!==e.project?o.a.createElement(w.a,null,o.a.createElement(C.a,{className:"navdropdown",title:"Layers",id:"basic-nav-dropdown"},o.a.createElement(r,{title:"Add Layer",className:"navdropdownitem",projects:e.projects,onClick:a}),o.a.createElement(C.a.Divider,null),o.a.createElement(r,{title:"Remove Layer",className:"navdropdownitem",projects:e.layers,onClick:s}),o.a.createElement(C.a.Divider,null),o.a.createElement(C.a.Item,{className:"navdropdownitem",href:"#centreline",onClick:function(e){return t.loadCentreline(e)}},"Add centreline "),o.a.createElement(C.a.Divider,null),o.a.createElement(C.a.Item,{className:"navdropdownitem",href:"#filter",onClick:function(e){return n(e)}},"Filter Layer"))):o.a.createElement(w.a,null,o.a.createElement(C.a,{className:"navdropdown",title:"Layers",id:"basic-nav-dropdown"},o.a.createElement(r,{title:"Add Layer",className:"navdropdownitem",projects:e.projects,onClick:function(e){return a(e)}}),o.a.createElement(C.a.Divider,null),o.a.createElement(C.a.Item,{title:"Remove Layer",className:"navdropdownitem",href:"#centreline",onClick:function(e){return t.removeLayer(e)}},"Remove layer")))}),{project:this.state.activeProject,projects:this.state.projectArr,layers:this.state.activeLayers,removeLayer:function(t){return e.removeLayer(t)},loadLayer:function(t){return e.loadLayer(t)},clickFilter:function(t){return e.clickFilter(t)}}),o.a.createElement(w.a,null,o.a.createElement(C.a,{className:"navdropdown",title:"Help",id:"basic-nav-dropdown"},o.a.createElement(C.a.Item,{className:"navdropdownitem",href:"#terms",onClick:function(t){return e.clickTerms(t)}},"Terms of Use"),o.a.createElement(C.a.Divider,null),o.a.createElement(C.a.Item,{className:"navdropdownitem",href:"#contact",onClick:function(t){return e.clickContact(t)}},"Contact"),o.a.createElement(C.a.Divider,null),o.a.createElement(C.a.Item,{className:"navdropdownitem",id:"Documentation",href:"#documentation",onClick:function(t){return e.documentation(t)}},"Documentation"),o.a.createElement(C.a.Divider,null),o.a.createElement(C.a.Item,{className:"navdropdownitem",href:"#about",onClick:function(t){return e.clickAbout(t)}},"About"))),o.a.createElement(A,{ref:this.customNav,className:"navdropdown"}))),o.a.createElement("div",{className:"map"},o.a.createElement(v.a,{ref:function(t){e.map=t},className:"map",fault:a,photo:n,worldCopyJump:!0,boxZoom:!0,center:t,zoom:this.state.zoom,onZoom:function(t){return e.onZoom(t)}},o.a.createElement(p.a,{className:"mapLayer",attribution:'&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors and Chat location by Iconika from the Noun Project',url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",zIndex:999}),o.a.createElement(f.a,null),o.a.createElement(S.a,{className:"satellite",src:this.state.osmThumbnail,onClick:function(t){return e.toogleMap(t)},thumbnail:!0}),o.a.createElement(g.a,{position:"topright"},this.state.activeLayers.map((function(t,r){return o.a.createElement(g.a.Overlay,{key:"".concat(r),checked:!0,name:t.description+" "+t.date},o.a.createElement(y.a,null,e.state.objData.map((function(t,r){return o.a.createElement(k.a,{key:"".concat(r),index:r,data:a,photo:n,position:t.latlng,icon:e.getCustomIcon(e.getFault(r,"priority"),e.state.zoom),draggable:!1,onClick:function(t){return e.clickMarker(t)}},o.a.createElement(E.a,{className:"popup"},o.a.createElement("div",null,o.a.createElement("p",{className:"faulttext"},o.a.createElement("b",null,"Type: ")," ",e.getFault(r,"fault")," ",o.a.createElement("br",null)," ",o.a.createElement("b",null,"Priority: "," ")," ",e.getFault(r,"priority")," ",o.a.createElement("br",null),o.a.createElement("b",null,"Location: "," ")," ",e.getFault(r,"location")),o.a.createElement("div",null,o.a.createElement(S.a,{className:"thumbnail",src:e.state.amazon+e.getFault(r,"photo")+".jpg",photo:n,onClick:function(t){return e.clickImage(t)},thumbnail:!0})))))}))))}))),this.state.centreData.map((function(t,a){return o.a.createElement(b.a,{key:"".concat(a),weight:3,color:e.getColor(),smoothFactor:3,positions:t})})))),o.a.createElement(x.a,{className:"filterModal",show:this.state.filterModal,size:"lg",centered:!0},o.a.createElement(x.a.Header,null,o.a.createElement(x.a.Title,null,"Filter"),o.a.createElement("br",null),o.a.createElement(j.a,{size:"sm"},this.state.faultClass.map((function(t,a){return o.a.createElement(j.a.Item,{key:"".concat(a),className:"page-item",active:a===e.state.pageActive,onClick:function(){return e.clickPage(a)}},t.description)})))),o.a.createElement(x.a.Body,null,o.a.createElement(N.a,{size:"sm",striped:!0,bordered:!0,hover:!0},o.a.createElement("thead",null),o.a.createElement("tbody",null,this.state.faultTypes.map((function(t,a){return o.a.createElement("tr",{className:"tablerow",key:"".concat(a)},o.a.createElement("td",null,o.a.createElement("input",{type:"checkbox",id:t.fault,checked:e.isChecked(t.fault),onChange:function(t){return e.changeCheck(t)}})," ",t.fault))}))))),o.a.createElement(x.a.Footer,null,o.a.createElement("div",null,o.a.createElement(z.a,{className:"clear",variant:"primary",type:"submit",onClick:function(t){return e.clearFilter(t)}},"Clear Filter")),o.a.createElement("div",null,o.a.createElement(z.a,{className:"submit",variant:"primary",type:"submit",onClick:function(t){return e.submitFilter(t)}},"Filter")))),o.a.createElement(x.a,{className:"termsModal",show:this.state.showTerms,size:"md",centered:!0},o.a.createElement(x.a.Header,null,o.a.createElement(x.a.Title,null,o.a.createElement("h2",null,"Road Inspection Viewer"))),o.a.createElement(x.a.Body,null,"By using this software you confirm you have read and agreed to the Onsite Developments Ltd. ",o.a.createElement("a",{href:"https://osmium.nz/?#terms"}," Click for terms of use."),o.a.createElement("br",null),"All data on this site from Land Information New Zealand is made available under a Creative Commons Attribution Licence.",o.a.createElement("br",null),o.a.createElement("span",null,"\xa9 2019 Onsite Developments Ltd. All rights reserved."),o.a.createElement("br",null)),o.a.createElement(x.a.Footer,null,o.a.createElement(z.a,{variant:"primary",type:"submit",onClick:function(t){return e.clickClose(t)}},"Close"))),o.a.createElement(x.a,{className:"aboutModal",show:this.state.showAbout,size:"md",centered:!0},o.a.createElement(x.a.Header,null,o.a.createElement(x.a.Title,null,o.a.createElement("h2",null,"About")," ")),o.a.createElement(x.a.Body,null,o.a.createElement("b",null,"Road Inspection Version 1.0"),o.a.createElement("br",null),"Relased: 12/01/2020",o.a.createElement("br",null),"Company: Onsite Developments Ltd.",o.a.createElement("br",null),"Software Developer: Matt Wynyard ",o.a.createElement("br",null),o.a.createElement("img",{src:"logo192.png",alt:"React logo",width:"24",height:"24"})," React: 16.12.0",o.a.createElement("br",null),o.a.createElement("img",{src:"bootstrap.png",alt:"Bottstrap logo",width:"24",height:"24"})," Bootstrap: 4.4.0",o.a.createElement("br",null),o.a.createElement("img",{src:"leafletlogo.png",alt:"Leaflet logo",width:"60",height:"16"}),"Leaflet: 1.6.0",o.a.createElement("br",null),o.a.createElement("img",{src:"reactbootstrap.png",alt:"React-Bootstrap logo",width:"24",height:"24"}),"React-bootstrap: 1.0.0-beta.16",o.a.createElement("br",null),"React-leaflet: 2.6.0",o.a.createElement("br",null)),o.a.createElement(x.a.Footer,null,o.a.createElement(z.a,{variant:"primary",size:"sm",type:"submit",onClick:function(t){return e.clickClose(t)}},"Close"))),o.a.createElement(x.a,{show:this.state.showLogin,size:"sm",centered:!0},o.a.createElement(x.a.Header,null,o.a.createElement(x.a.Title,null,o.a.createElement("img",{src:"padlock.png",alt:"padlock",width:"42",height:"42"})," Login ")),o.a.createElement(x.a.Body,null,o.a.createElement(_.a,null,o.a.createElement(_.a.Group,{controlId:"userName"},o.a.createElement(_.a.Label,null,"Username"),o.a.createElement(_.a.Control,{type:"text",placeholder:"Enter username",ref:function(t){return e.userInput=t}})),o.a.createElement(_.a.Group,{controlId:"formBasicPassword"},o.a.createElement(_.a.Label,null,"Password"),o.a.createElement(_.a.Control,{type:"password",placeholder:"Password",ref:function(t){return e.passwordInput=t}})),o.a.createElement(z.a,{variant:"primary",type:"submit",onClick:function(t){return e.login(t)}},"Submit"))),o.a.createElement(x.a.Footer,null)),o.a.createElement(x.a,{show:this.state.show,size:"xl"},o.a.createElement(x.a.Body,{className:"photoBody"},o.a.createElement("div",{className:"container"},o.a.createElement("div",{className:"row"},o.a.createElement("div",{className:"col-md-6"},o.a.createElement("b",null,"Type: ")," ",this.getFault(this.state.index,"fault")," ",o.a.createElement("br",null)," ",o.a.createElement("b",null,"Priority: "," ")," ",this.getFault(this.state.index,"priority")," ",o.a.createElement("br",null),o.a.createElement("b",null,"Location: "," ")," ",this.getFault(this.state.index,"priority")),o.a.createElement("div",{className:"col-md-6"},o.a.createElement("b",null,"Size: ")," ",this.getFault(this.state.index,"size")," ",o.a.createElement("br",null)," ",o.a.createElement("b",null,"DateTime: "," ")," ",this.getFault(this.state.index,"datetime")))),o.a.createElement(S.a,{className:"photo",src:this.state.amazon+this.state.currentPhoto+".jpg",data:a,onClick:function(t){return e.clickImage(t)},thumbnail:!0})),o.a.createElement(x.a.Footer,null,o.a.createElement(z.a,{className:"prev",onClick:function(t){return e.clickPrev(t)}},"Previous"),o.a.createElement(z.a,{variant:"primary",onClick:function(t){return e.closePhotoModal(t)}},"Close"),o.a.createElement(z.a,{className:"next",variant:"primary",onClick:function(t){return e.clickNext(t)}},"Next"))),o.a.createElement("div",{className:"footer"}))}}]),t}(o.a.Component),I=Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));function B(e,t){navigator.serviceWorker.register(e).then((function(e){e.onupdatefound=function(){var a=e.installing;null!=a&&(a.onstatechange=function(){"installed"===a.state&&(navigator.serviceWorker.controller?(console.log("New content is available and will be used when all tabs for this page are closed. See https://bit.ly/CRA-PWA."),t&&t.onUpdate&&t.onUpdate(e)):(console.log("Content is cached for offline use."),t&&t.onSuccess&&t.onSuccess(e)))})}})).catch((function(e){console.error("Error during service worker registration:",e)}))}s.a.render(o.a.createElement(M,null),document.getElementById("root")),function(e){if("serviceWorker"in navigator){if(new URL("",window.location.href).origin!==window.location.origin)return;window.addEventListener("load",(function(){var t="".concat("","/service-worker.js");I?(!function(e,t){fetch(e).then((function(a){var n=a.headers.get("content-type");404===a.status||null!=n&&-1===n.indexOf("javascript")?navigator.serviceWorker.ready.then((function(e){e.unregister().then((function(){window.location.reload()}))})):B(e,t)})).catch((function(){console.log("No internet connection found. App is running in offline mode.")}))}(t,e),navigator.serviceWorker.ready.then((function(){console.log("This web app is being served cache-first by a service worker. To learn more, visit https://bit.ly/CRA-PWA")}))):B(t,e)}))}}()}},[[66,1,2]]]);
//# sourceMappingURL=main.8349d226.chunk.js.map