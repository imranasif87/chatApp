var currentUserKey = '';
var chatKey = '';
var friend_id = '';

document.addEventListener('keydown', function (key) {
    if (key.which === 13) {
        SendMessage();
    }
});

////////////////////////////////////////
function ChangeSendIcon(control) {
    if (control.value !== '') {
        document.getElementById('send').removeAttribute('style');
        document.getElementById('audio').setAttribute('style', 'display:none');
    }
    else {
        document.getElementById('audio').removeAttribute('style');
        document.getElementById('send').setAttribute('style', 'display:none');
    }
}

/////////////////////////////////////////////
// Audio record

let chunks = [];
let recorder;
var timeout;

function record(control) {
    let device = navigator.mediaDevices.getUserMedia({ audio: true });
    device.then(stream => {
        if (recorder === undefined) {
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = e => {
                chunks.push(e.data);

                if (recorder.state === 'inactive') {
                    let blob = new Blob(chunks, { type: 'audio/webm' });
                    //document.getElementById('audio').innerHTML = '<source src="' + URL.createObjectURL(blob) + '" type="video/webm" />'; //;
                    var reader = new FileReader();

                    reader.addEventListener("load", function () {
                        var chatMessage = {
                            userId: currentUserKey,
                            msg: reader.result,
                            msgType: 'audio',
                            dateTime: new Date().toLocaleString()
                        };

                        firebase.database().ref('chatMessages').child(chatKey).push(chatMessage, function (error) {
                            if (error) alert(error);
                            else {

                                document.getElementById('txtMessage').value = '';
                                document.getElementById('txtMessage').focus();
                            }
                        });
                    }, false);

                    reader.readAsDataURL(blob);
                }
            }

            recorder.start();
            control.setAttribute('class', 'fas fa-stop fa-2x');
        }
    });

    if (recorder !== undefined) {
        if (control.getAttribute('class').indexOf('stop') !== -1) {
            recorder.stop();
            control.setAttribute('class', 'fas fa-microphone fa-2x');
        }
        else {
            chunks = [];
            recorder.start();
            control.setAttribute('class', 'fas fa-stop fa-2x');
        }
    }
}

/////////////////////////////////////////////////////////////////
// Emoji
loadAllEmoji();

function loadAllEmoji() {
    var emoji = '';
    for (var i = 128512; i <= 128566; i++) {
        emoji += `<a href="#" style="font-size: 22px;" onclick="getEmoji(this)">&#${i};</a>`;
    }

    document.getElementById('smiley').innerHTML = emoji;
}

function showEmojiPanel() {
    document.getElementById('emoji').removeAttribute('style');
}

function hideEmojiPanel() {
    document.getElementById('emoji').setAttribute('style', 'display:none;');
}

function getEmoji(control) {
    document.getElementById('txtMessage').value += control.innerHTML;
}
//////////////////////////////////////////////////////////////////////
function StartChat(friendKey, friendName, friendPhoto) {
    var friendList = { friendId: friendKey, userId: currentUserKey };
    friend_id = friendKey;

    var db = firebase.database().ref('friend_list');
    var flag = false;
    db.on('value', function (friends) {
        friends.forEach(function (data) {
            var user = data.val();
            if ((user.friendId === friendList.friendId && user.userId === friendList.userId) || ((user.friendId === friendList.userId && user.userId === friendList.friendId))) {
                flag = true;
                chatKey = data.key;
            }
        });

        if (flag === false) {
            chatKey = firebase.database().ref('friend_list').push(friendList, function (error) {
                if (error) alert(error);
                else {
                    document.getElementById('chatPanel').removeAttribute('style');
                    document.getElementById('divStart').setAttribute('style', 'display:none');
                    hideChatList();
                }
            }).getKey();
        }
        else {
            document.getElementById('chatPanel').removeAttribute('style');
            document.getElementById('divStart').setAttribute('style', 'display:none');
            hideChatList();
        }
        //////////////////////////////////////
        //display friend name and photo
        document.getElementById('divChatName').innerHTML = friendName;
        document.getElementById('imgChat').src = friendPhoto;

        document.getElementById('messages').innerHTML = '';

        document.getElementById('txtMessage').value = '';
        document.getElementById('txtMessage').focus();
        ////////////////////////////
        // Display The chat messages
        LoadChatMessages(chatKey, friendPhoto);
    });
}

//////////////////////////////////////

function LoadChatMessages(chatKey, friendPhoto) {
    var db = firebase.database().ref('chatMessages').child(chatKey);
    db.on('value', function (chats) {
        var messageDisplay = '';
        chats.forEach(function (data) {
            var chat = data.val();
            var dateTime = chat.dateTime.split(",");
            var msg = '';
            if (chat.msgType === 'image') {
                msg = `<img src='${chat.msg}' class="img-fluid" />`;
            }
            else if (chat.msgType === 'audio') {
                msg = `<audio controls>
                        <source src="${chat.msg}" type="video/webm" />
                    </audio>`;
            }
            else {
                msg = chat.msg;
            }
            if (chat.userId !== currentUserKey) {
                messageDisplay += `<div class="row">
                                    <div class="col-2 col-sm-1 col-md-1">
                                        <img src="${friendPhoto}" class="chat-pic rounded-circle" />
                                    </div>
                                    <div class="col-6 col-sm-7 col-md-7">
                                        <p class="receive">
                                            ${msg}
                                            <span class="time float-right" title="${dateTime[0]}">${dateTime[1]}</span>
                                        </p>
                                    </div>
                                </div>`;
            }
            else {
                messageDisplay += `<div class="row justify-content-end">
                            <div class="col-6 col-sm-7 col-md-7">
                                <p class="sent float-right">
                                    ${msg}
                                    <span class="time float-right" title="${dateTime[0]}">${dateTime[1]}</span>
                                </p>
                            </div>
                            <div class="col-2 col-sm-1 col-md-1">
                                <img src="${firebase.auth().currentUser.photoURL}" class="chat-pic rounded-circle" />
                            </div>
                        </div>`;
            }
        });

        document.getElementById('messages').innerHTML = messageDisplay;
        document.getElementById('messages').scrollTo(0, document.getElementById('messages').scrollHeight);
    });
}

function showChatList() {
    document.getElementById('side-1').classList.remove('d-none', 'd-md-block');
    document.getElementById('side-2').classList.add('d-none');
}

function hideChatList() {
    document.getElementById('side-1').classList.add('d-none', 'd-md-block');
    document.getElementById('side-2').classList.remove('d-none');
}


function SendMessage() {
    var chatMessage = {
        userId: currentUserKey,
        msg: document.getElementById('txtMessage').value,
        msgType: 'normal',
        dateTime: new Date().toLocaleString()
    };

    firebase.database().ref('chatMessages').child(chatKey).push(chatMessage, function (error) {
        if (error) alert(error);
        else {
            firebase.database().ref('fcmTokens').child(friend_id).once('value').then(function (data) {
                $.ajax({
                    url: 'https://fcm.googleapis.com/fcm/send',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'key=AIzaSyBXkd3HN8IO3Xa4AFTvqFpo5LXZQ9-Rj7s'
                    },
                    data: JSON.stringify({
                        'to': data.val().token_id, 'data': { 'message': chatMessage.msg.substring(0, 30) + '...', 'icon': firebase.auth().currentUser.photoURL }
                    }),
                    success: function (response) {
                        console.log(response);
                    },
                    error: function (xhr, status, error) {
                        console.log(xhr.error);
                    }
                });
            });
            document.getElementById('txtMessage').value = '';
            document.getElementById('txtMessage').focus();
        }
    });
}

///////////////////////////////////////////////////////////////
//Send image
function ChooseImage() {
    document.getElementById('imageFile').click();
}

function SendImage(event) {
    var file = event.files[0];

    if (!file.type.match("image.*")) {
        alert("Please select image only.");
    }
    else {
        var reader = new FileReader();

        reader.addEventListener("load", function () {
            var chatMessage = {
                userId: currentUserKey,
                msg: reader.result,
                msgType: 'image',
                dateTime: new Date().toLocaleString()
            };

            firebase.database().ref('chatMessages').child(chatKey).push(chatMessage, function (error) {
                if (error) alert(error);
                else {

                    document.getElementById('txtMessage').value = '';
                    document.getElementById('txtMessage').focus();
                }
            });
        }, false);

        if (file) {
            reader.readAsDataURL(file);
        }
    }
}
///////////////////////////////////////////////////////////////////////
/////////////

function LoadChatList() {
    var db = firebase.database().ref('friend_list');
    db.on('value', function (lists) {
        document.getElementById('lstChat').innerHTML = `<li class="list-group-item" style="background-color:#f8f8f8;">
                            <input type="text" placeholder="Search or new chat" class="form-control form-rounded" />
                        </li>`;
        lists.forEach(function (data) {
            var lst = data.val();
            var friendKey = '';
            if (lst.friendId === currentUserKey) {
                friendKey = lst.userId;
            }
            else if (lst.userId === currentUserKey) {
                friendKey = lst.friendId;
            }

            if (friendKey !== "") {
                firebase.database().ref('users').child(friendKey).on('value', function (data) {
                    var user = data.val();
                    document.getElementById('lstChat').innerHTML += `<li class="list-group-item list-group-item-action" onclick="StartChat('${data.key}', '${user.name}', '${user.photoURL}')">
                            <div class="row">
                                <div class="col-md-2">
                                    <img src="${user.photoURL}" class="friend-pic rounded-circle" />
                                </div>
                                <div class="col-md-10" style="cursor:pointer;">
                                    <div class="name">${user.name}</div>
                                    <div class="under-name">This is some message text...</div>
                                </div>
                            </div>
                        </li>`;
                });
            }
        });
    });
}

function PopulateUserList() {
    document.getElementById('lstUsers').innerHTML = `<div class="text-center">
                                                         <span class="spinner-border text-primary mt-5" style="width:7rem;height:7rem"></span>
                                                     </div>`;
    var db = firebase.database().ref('users');
    var dbNoti = firebase.database().ref('notifications');
    var lst = '';
    db.on('value', function (users) {
        if (users.hasChildren()) {
            lst = `<li class="list-group-item" style="background-color:#f8f8f8;">
                            <input type="text" placeholder="Search or new chat" class="form-control form-rounded" />
                        </li>`;
            document.getElementById('lstUsers').innerHTML = lst;
        }
        users.forEach(function (data) {
            var user = data.val();
            if (user.email !== firebase.auth().currentUser.email) {
                dbNoti.orderByChild('sendTo').equalTo(data.key).on('value', function (noti) {
                    if (noti.numChildren() > 0 && Object.values(noti.val())[0].sendFrom === currentUserKey) {
                        lst = `<li class="list-group-item list-group-item-action">
                            <div class="row">
                                <div class="col-md-2">
                                    <img src="${user.photoURL}" class="rounded-circle friend-pic" />
                                </div>
                                <div class="col-md-10" style="cursor:pointer;">
                                    <div class="name">${user.name}
                                        <button class="btn btn-sm btn-defualt" style="float:right;"><i class="fas fa-user-plus"></i> Sent</button>
                                    </div>
                                </div>
                            </div>
                        </li>`;
                        document.getElementById('lstUsers').innerHTML += lst;
                    }
                    else {
                        dbNoti.orderByChild('sendFrom').equalTo(data.key).on('value', function (noti) {
                            if (noti.numChildren() > 0 && Object.values(noti.val())[0].sendTo === currentUserKey) {
                                lst = `<li class="list-group-item list-group-item-action">
                            <div class="row">
                                <div class="col-md-2">
                                    <img src="${user.photoURL}" class="rounded-circle friend-pic" />
                                </div>
                                <div class="col-md-10" style="cursor:pointer;">
                                    <div class="name">${user.name}
                                        <button class="btn btn-sm btn-defualt" style="float:right;"><i class="fas fa-user-plus"></i> Pending</button>
                                    </div>
                                </div>
                            </div>
                        </li>`;
                                document.getElementById('lstUsers').innerHTML += lst;
                            }
                            else {
                                lst = `<li class="list-group-item list-group-item-action" data-dismiss="modal">
                            <div class="row">
                                <div class="col-md-2">
                                    <img src="${user.photoURL}" class="rounded-circle friend-pic" />
                                </div>
                                <div class="col-md-10" style="cursor:pointer;">
                                    <div class="name">${user.name}
                                        <button onclick="SendRequest('${data.key}')" class="btn btn-sm btn-primary" style="float:right;"><i class="fas fa-user-plus"></i> Send Request</button>
                                    </div>
                                </div>
                            </div>
                        </li>`;

                                document.getElementById('lstUsers').innerHTML += lst;
                            }
                        });
                    }
                });
            }
        });
    });

}

function NotificationCount() {
    let db = firebase.database().ref('notifications');

    db.orderByChild('sendTo').equalTo(currentUserKey).on('value', function (noti) {
        let notiArray = Object.values(noti.val()).filter(n => n.status === 'Pending');
        document.getElementById('notification').innerHTML = notiArray.length;
    });
}

function SendRequest(key) {
    let notification = {
        sendTo: key,
        sendFrom: currentUserKey,
        name: firebase.auth().currentUser.displayName,
        photo: firebase.auth().currentUser.photoURL,
        dateTime: new Date().toLocaleString(),
        status: 'Pending'
    };

    firebase.database().ref('notifications').push(notification, function (error) {
        if (error) alert(error);
        else {
            // do something
            PopulateUserList();
        }
    });
}

function PopulateNotifications() {
    document.getElementById('lstNotification').innerHTML = `<div class="text-center">
                                                         <span class="spinner-border text-primary mt-5" style="width:7rem;height:7rem"></span>
                                                     </div>`;
    var db = firebase.database().ref('notifications');
    var lst = '';
    db.orderByChild('sendTo').equalTo(currentUserKey).on('value', function (notis) {
        if (notis.hasChildren()) {
            lst = `<li class="list-group-item" style="background-color:#f8f8f8;">
                            <input type="text" placeholder="Search or new chat" class="form-control form-rounded" />
                        </li>`;
        }
        notis.forEach(function (data) {
            var noti = data.val();
            if (noti.status === 'Pending') {
                lst += `<li class="list-group-item list-group-item-action">
                            <div class="row">
                                <div class="col-md-2">
                                    <img src="${noti.photo}" class="rounded-circle friend-pic" />
                                </div>
                                <div class="col-md-10" style="cursor:pointer;">
                                    <div class="name">${noti.name}
                                        <button onclick="Reject('${data.key}')" class="btn btn-sm btn-danger" style="float:right;margin-left:1%;"><i class="fas fa-user-times"></i> Reject</button>
                                        <button onclick="Accept('${data.key}')" class="btn btn-sm btn-success" style="float:right;"><i class="fas fa-user-check"></i> Accept</button>
                                    </div>
                                </div>
                            </div>
                        </li>`;
            }
        });

        document.getElementById('lstNotification').innerHTML = lst;
    });
}

function Reject(key) {
    let db = firebase.database().ref('notifications').child(key).once('value', function (noti) {
        let obj = noti.val();
        obj.status = 'Reject';
        firebase.database().ref('notifications').child(key).update(obj, function (error) {
            if (error) alert(error);
            else {
                // do something
                PopulateNotifications();
            }
        });
    });
}

function Accept(key) {
    let db = firebase.database().ref('notifications').child(key).once('value', function (noti) {
        var obj = noti.val();
        obj.status = 'Accept';
        firebase.database().ref('notifications').child(key).update(obj, function (error) {
            if (error) alert(error);
            else {
                // do something
                PopulateNotifications();
                var friendList = { friendId: obj.sendFrom, userId: obj.sendTo };
                firebase.database().ref('friend_list').push(friendList, function (error) {
                    if (error) alert(error);
                    else {
                        //do Something
                    }
                });
            }
        });
    });
}

function PopulateFriendList() {
    //document.getElementById('lstFriend').innerHTML = `<div class="text-center">
    //                                                     <span class="spinner-border text-primary mt-5" style="width:7rem;height:7rem"></span>
    //                                                 </div>`;
    //var db = firebase.database().ref('users');
    //var lst = '';
    //db.on('value', function (users) {
    //    if (users.hasChildren()) {
    //        lst = `<li class="list-group-item" style="background-color:#f8f8f8;">
    //                        <input type="text" placeholder="Search or new chat" class="form-control form-rounded" />
    //                    </li>`;
    //    }
    //    users.forEach(function (data) {
    //        var user = data.val();
    //        if (user.email !== firebase.auth().currentUser.email) {
    //            lst += `<li class="list-group-item list-group-item-action" data-dismiss="modal" onclick="StartChat('${data.key}', '${user.name}', '${user.photoURL}')">
    //                        <div class="row">
    //                            <div class="col-md-2">
    //                                <img src="${user.photoURL}" class="rounded-circle friend-pic" />
    //                            </div>
    //                            <div class="col-md-10" style="cursor:pointer;">
    //                                <div class="name">${user.name}</div>
    //                            </div>
    //                        </div>
    //                    </li>`;
    //        }
    //    });

    //    document.getElementById('lstFriend').innerHTML = lst;
    //});

}

function signIn() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
}

function signOut() {
    firebase.auth().signOut();
}

function onFirebaseStateChanged() {
    firebase.auth().onAuthStateChanged(onStateChanged);
}

function onStateChanged(user) {
    if (user) {
        //alert(firebase.auth().currentUser.email + '\n' + firebase.auth().currentUser.displayName);

        var userProfile = { email: '', name: '', photoURL: '' };
        userProfile.email = firebase.auth().currentUser.email;
        userProfile.name = firebase.auth().currentUser.displayName;
        userProfile.photoURL = firebase.auth().currentUser.photoURL;

        var db = firebase.database().ref('users');
        var flag = false;
        db.on('value', function (users) {
            users.forEach(function (data) {
                var user = data.val();
                if (user.email === userProfile.email) {
                    currentUserKey = data.key;
                    flag = true;
                }
            });

            if (flag === false) {
                firebase.database().ref('users').push(userProfile, callback);
            }
            else {
                document.getElementById('imgProfile').src = firebase.auth().currentUser.photoURL;
                document.getElementById('imgProfile').title = firebase.auth().currentUser.displayName;

                document.getElementById('lnkSignIn').style = 'display:none';
                document.getElementById('lnkSignOut').style = '';
            }

            const messaging = firebase.messaging();

            navigator.serviceWorker.register('./firebase-messaging-sw.js')
                .then((registration) => {
                    messaging.useServiceWorker(registration);

                    // Request permission and get token.....
                    messaging.requestPermission().then(function () {
                        return messaging.getToken();
                    }).then(function (token) {
                        firebase.database().ref('fcmTokens').child(currentUserKey).set({ token_id: token });
                    })
                });

            document.getElementById('lnkNewChat').classList.remove('disabled');
            LoadChatList();
            NotificationCount();
        });
    }
    else {
        document.getElementById('imgProfile').src = 'images/pp.png';
        document.getElementById('imgProfile').title = '';

        document.getElementById('lnkSignIn').style = '';
        document.getElementById('lnkSignOut').style = 'display:none';

        document.getElementById('lnkNewChat').classList.add('disabled');
    }
}

function callback(error) {
    if (error) {
        alert(error);
    }
    else {
        document.getElementById('imgProfile').src = firebase.auth().currentUser.photoURL;
        document.getElementById('imgProfile').title = firebase.auth().currentUser.displayName;

        document.getElementById('lnkSignIn').style = 'display:none';
        document.getElementById('lnkSignOut').style = '';
    }
}

/////////
// Call auth State changed

onFirebaseStateChanged();