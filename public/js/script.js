var videos = [];
var rooms = [1,2,3,4,5];
var PeerConnection = window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection;

$(document).ready(function(){

  $("#videos li a").on("click", function(event){
    event.target.webkitRequestFullScreen();
  });

  $("#login_me").click( function() {
    $("#login_div").hide();
    $("#session_div").show();
    var nickname = $("#my_nick").val();
    LiveCast.send("login", { "nickname": nickname }, function(){alert("LiveCast.send");} );
  });

  rtc.on("on_login", function(data){
    //role=teacher|student , allUsers {socketid:nickname}
    console.log("on_login");
    $(data.allUsers).each(function(index, user){
      
      if(PeerConnection){
        rtc.createStream({"video": true, "audio": true}, function(stream) {
          var id = ''; //fsdfsfsfsfsd
          if(user.role != "teacher"){
            StudentsList.add(user.nickname,user.socketId,user.role);
            id = 'vid_' + user.socketId;            
          }else{
            id="teacher-video"
          }
          var vid = $("#" + id);
          vid.src = URL.createObjectURL(stream);
          videos.push(vid);
          rtc.attachStream(stream, id);
          //subdivideVideos();
        });
      }else {
        alert('Your browser is not supported or you have to turn on flags. In chrome you go to chrome://flags and turn on Enable PeerConnection remember to restart chrome');
      }

    });
  });

  rtc.on('user_added', function  (data) {
     console.log('User added');
     console.log(data);
     if(PeerConnection){
        rtc.createStream({"video": true, "audio": true}, function(stream) {
          var id = ''; //fsdfsfsfsfsd
          StudentsList.add(data.nickname,data.socketId,'student');
          id = 'vid_' + data.socketId;            
          var vid = $("#" + id);
          vid.src = URL.createObjectURL(stream);
          videos.push(vid);
          rtc.attachStream(stream, id);
          //subdivideVideos();
        });
      }else {
        alert('Your browser is not supported or you have to turn on flags. In chrome you go to chrome://flags and turn on Enable PeerConnection remember to restart chrome');
      }
  })
});

function getNumPerRow() {
  var len = videos.length;
  var biggest;

      // Ensure length is even for better division.
      if (len % 2 === 1) {
        len++;
      }

      biggest = Math.ceil(Math.sqrt(len));
      while (len % biggest !== 0) {
        biggest++;
      }
      return biggest;
}

function subdivideVideos() {
  var perRow = getNumPerRow();
  var numInRow = 0;
  for (var i = 0, len = videos.length; i < len; i++) {
    var video = videos[i];
    //setWH(video, i);
    video.height = 200;
    numInRow = (numInRow + 1) % perRow;
  }
}

function setWH(video, i) {
  var perRow = getNumPerRow();
  var perColumn = Math.ceil(videos.length / perRow);
  var width = Math.floor((window.innerWidth) / perRow);
  var height = Math.floor((window.innerHeight - 190) / perColumn);
  video.width = width;
  video.height = height;
  video.style.position = "absolute";
  video.style.left = (i % perRow) * width + "px";
  video.style.top = Math.floor(i / perRow) * height + "px";
}

function cloneVideo(domId, socketId) {
  var video = document.getElementById(domId);
  var clone = video.cloneNode(false);
  clone.id = "remote" + socketId;
  document.getElementById('videos').appendChild(clone);
  videos.push(clone);
  return clone;
}

function removeVideo(socketId) {
  var video = document.getElementById('remote' + socketId);
  if (video) {
    videos.splice(videos.indexOf(video), 1);
    video.parentNode.removeChild(video);
  }
}

function addToChat(msg, color) {
  var messages = document.getElementById('messages');
  msg = sanitize(msg);
  if (color) {
    msg = '<span style="color: ' + color + '; padding-left: 15px">' + msg + '</span>';
  } else {
    msg = '<strong style="padding-left: 15px">' + msg + '</strong>';
  }
  messages.innerHTML = messages.innerHTML + msg + '<br>';
  messages.scrollTop = 10000;
}

function sanitize(msg) {
  return msg.replace(/</g, '&lt;');
}

function initFullScreen() { 
  var button = document.getElementById("fullscreen");
  button.addEventListener('click', function(event) {
    var elem = document.getElementById("videos"); 
    //show full screen 
    elem.webkitRequestFullScreen();
  });
} 

function initNewRoom() {
  var button = document.getElementById("newRoom");

  button.addEventListener('click', function(event) {

    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 8;
    var randomstring = '';
    for (var i=0; i<string_length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum,rnum+1);
    }

    window.location.hash = randomstring;
    location.reload();
  })
}

function initChat() {
    var input =$("#chatinput");
    window.room = window.location.hash.slice(1);
    window.color = "#"+((1<<24)*Math.random()|0).toString(16);
    input.on('keyup',onKeyup);
    $("#send").on('click',sendChatMessage);
    rtc.on('receive_chat_msg', function(data) {
        console.log(data.color);
        addToChat(data.messages, data.color.toString(16));
    });
}

var onKeyup =  function(event){
    var key = event.which || event.keyCode;
    var input = $("#chatinput");
    if (key === 13) {
        sendChatMessage(input);
    }
}

function sendChatMessage(input){
    if(!input || !input.val){
        input =  $("#chatinput");
    }
    rtc._socket.send(JSON.stringify({
        "eventName": "chat_msg",
        "data": {
            "messages": input.val(),
            "room": room,
            "color": color
        }
    }), function(error) {
        if (error) {
            console.log(error);
        }
    });
    addToChat( input.val());
    input.val("") ;
}
function init() {
  if(PeerConnection){
    // rtc.createStream({"video": true, "audio": true}, function(stream) {
    //   document.getElementById('you').src = URL.createObjectURL(stream);
    //   videos.push(document.getElementById('you'));
    //   rtc.attachStream(stream, 'you');
      // subdivideVideos();
    //});
  }else {
    alert('Your browser is not supported or you have to turn on flags. In chrome you go to chrome://flags and turn on Enable PeerConnection remember to restart chrome');
  }

  
  var room = window.location.hash.slice(1);

  //When using localhost
  //rtc.connect("ws://localhost:8000/", room);
  var loc = document.location.toString().substring(7);
  rtc.connect("ws://"+loc, room);
  rtc.on('add remote stream', function(stream, socketId) {
    console.log("ADDING REMOTE STREAM...");
    var clone = cloneVideo('you', socketId);
    document.getElementById(clone.id).setAttribute("class", "");
    rtc.attachStream(stream, clone.id);
    //subdivideVideos();
  });
  rtc.on('disconnect stream', function(data) {
    console.log('remove ' + data);
    removeVideo(data);
  });

  rtc.on('on_login', function(data){
    Backbone.trigger('user-connected', data);
  });
  // initFullScreen();
  // initNewRoom();
  initChat();
}

// window.onresize = function(event) {
//   subdivideVideos();
// };

$(init);
//$(initChat());
