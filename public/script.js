const socket = io();



//getting video audio access
var myVideoStream;
var getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia;
getUserMedia({
    video: true,
    audio: true
}).then(localStream => {
    myVideoStream = localStream;
    const myVideo = document.createElement('video');
    addVideoStream(peer.id, myVideo, localStream);

    peer.on('call', call => {
        call.answer(localStream);
        console.log(call.peer);
        call.on('stream', remoteStream => {
            const video = document.createElement('video');
            addVideoStream(call.peer, video, remoteStream)
        })
        call.on('error', err => {
            console.log(err);
        })
    })
    peer.on('error', err => {
        console.log(err);
    })

    socket.on('user-connected', (userId) => {
        console.log(`userid ${userId}`);
        console.log(`peer id ${peer.id}`)
        if(userId != peer.id){
            // connectToNewUser(userId, localStream);
            setTimeout(connectToNewUser,1000,userId,localStream);
        }
        // We were trying to make call before the promise was resolved
        // setTimeout(connectToNewUser,1000,userId,localStream);
    })
});


// peer code
var peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: 443,
})

peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
});

// peer.on('close', () => {
//     socket.emit('disconnect');
// })

socket.on('user-disconnected', (userId) => {
    removeVideoStream(userId);
})

//calling the new user with our own stream
const connectToNewUser = (userId, localStream) => {
    const call = peer.call(userId, localStream);
    //if call is not answered properly we will recieve call object without remote stream
    console.log(call.peer);
    //call is the mediaconnection object which has 'stream' event
    //and the peers stream in the callback
    call.on('stream', remoteStream => {
        const video = document.createElement('video');
        addVideoStream(call.peer, video, remoteStream)
    });
    call.on('error', err => {
        console.log(err);
    })
}


//method to addvideo on the browser
const addVideoStream = (userId, video, stream) => {
    video.srcObject = stream;
    video.id = userId;
    document.getElementById('video-grid').appendChild(video);
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
}

const removeVideoStream = (id) => {
    let video = document.getElementById(id);
    if(video){
        video.remove();
    }
}

let msg = document.getElementById('chat-input');

document.addEventListener('keydown', e => {
    if(e.keyCode == 13 && msg.value.length !== 0){
        socket.emit('message', msg.value);
        msg.value='';
    }
})

socket.on('message-to-all', (message, id) => {
    console.log(message)
    console.log(id);
    const div = document.createElement('div');
    const p = document.createElement('p');
    p.style.fontWeight = 800;
    p.style.color = '#FFFFFF';
    p.textContent = id;
    const li = document.createElement('li');
    li.textContent = message;
    div.appendChild(p);
    div.appendChild(li);
    document.getElementById('messages').appendChild(div);
})


var toggleVideoOnOff = (event) => {
    const isEnabled = myVideoStream.getVideoTracks()[0].enabled;
    let btn = event.target.parentElement.className == 'icon-wrapper' ? event.target.parentElement : event.target;
    if(isEnabled){
        myVideoStream.getVideoTracks()[0].enabled = false;
        changeVideoButton(true, btn);
    }else{
        myVideoStream.getVideoTracks()[0].enabled = true;
        changeVideoButton(false, btn);
    }
}

var changeVideoButton = (isEnabled, btn) => {
    while(btn.firstChild){
        btn.firstChild.remove()
    }
    let i = document.createElement('i');
    let p = document.createElement('p');

    if(isEnabled){
        i.className = 'stop fas fa-video-slash';
        p.innerText = 'Start Video';
    }else{
        i.className = 'fas fa-video';
        p.innerText = 'stop Video';
    }
    btn.appendChild(i);
    btn.appendChild(p);
}


var toggleMicrophoneOnOff = (event) => {
    const isEnabled = myVideoStream.getAudioTracks()[0].enabled;
    let btn = event.target.parentElement.className == 'icon-wrapper' ? event.target.parentElement : event.target;
    if(isEnabled){
        myVideoStream.getAudioTracks()[0].enabled = false;
        changeMicrophoneButton(true, btn);
    }else{
        myVideoStream.getAudioTracks()[0].enabled = true;
        changeMicrophoneButton(false, btn);
    }
}

var changeMicrophoneButton = (isEnabled, btn) => {
    while(btn.firstChild){
        btn.firstChild.remove()
    }
    let i = document.createElement('i');
    let p = document.createElement('p');
    if(isEnabled){
        i.className = 'unmute fas fa-microphone-slash';
        i.style.color = 'red';
        p.innerText = 'Unmute';
    }else{
        i.className = 'fas fa-microphone';
        p.innerText = 'Mute';
    }
    btn.appendChild(i);
    btn.appendChild(p);
}

var toggleMessageWindow = (event) => {
    var chatWindow = document.querySelector('.right-container');
    var mainContainer = document.querySelector('.main-container');
    if(chatWindow.style.display == 'flex'){
        chatWindow.style.display = 'none';
        mainContainer.style.gridTemplateColumns = '1fr';
        mainContainer.style.gridTemplateAreas = 'left-container';
    }else{
        chatWindow.style.display = 'flex';
        mainContainer.style.gridTemplateColumns = '4fr 1fr';
        mainContainer.style.gridTemplateAreas = 'left-container right-container';
    }
}

var leaveMeeting = (event) => {
    window.addEventListener('beforeunload', () => {
        socket.emit('disconnect');
    })
    window.location = '/';
}