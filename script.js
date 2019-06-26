'use strict';
// 상태 관련
let shuffleStatus = false;
let repeatStatus = false;
let nowPlayingIndex;
let nowPlayingVideoId;

let musicList = [];

let shuffledIndex = 0;
let shuffledMusicList = [];

const repeatBtn = document.querySelector('body > div.container > div > div > i:nth-child(1)')
const shuffleBtn = document.querySelector('body > div.container > div > div > i:nth-child(8)')
//const sequentialBtn = document.querySelector('body > div.container > div > div > i:nth-child(9)')
// 유튜브 관련
let tag = document.createElement('script');


tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '350',
        width: '500',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        },
    });
}

function onPlayerReady(event) {
    if(!musicListSaveCheck()){
        player.loadVideoById({
            videoId: 'yyzYr21MumM'
        });
    } else {
        loadVideoByVideoId(0, musicList[0].videoId);
    }
}

function onPlayerStateChange(event) {
    // 가끔 재생불가능한게 있는데 이거 비동기적으로 처리하려함
    nowPlayingVideoId = player.getVideoData().video_id;
    if(player.getPlayerState() == -1){
        setTimeout(function(){
            const videoId = nowPlayingVideoId
            if((player.getPlayerState() == -1) && videoId == nowPlayingVideoId){
                playNext()
            }
        }, 5000)
    }
    // 영상 끝났을 때 다음곡 재생
    if(player.getPlayerState() == 0){
        playNext();
    }
    // 버튼 보이고 안보이게 하는거
    if(player.getPlayerState() == 1){
        document.querySelector('#pauseBtn').hidden = false
        document.querySelector('#playBtn').hidden = true
    } else if(player.getPlayerState() == 2){
        document.querySelector('#pauseBtn').hidden = true
        document.querySelector('#playBtn').hidden = false
    }
}

$('#addModal').on('shown.bs.modal', function() {
    $('#addModal').trigger('focus')
});

// AIzaSyCbre9oUFZj2nSX4VOeAPXwR7Fn_B7Ach4
// AIzaSyBUlxHJhYVIBZ7DeveD42xAfVq8JkrLkYc
function getSearchList() {
    $.ajax({
        url: "https://www.googleapis.com/youtube/v3/search",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        data: {
            q: document.getElementById('searchKeyword').value,
            part: 'snippet',
            key: 'AIzaSyBUlxHJhYVIBZ7DeveD42xAfVq8JkrLkYc',
            maxResults: 30, //50
            order: 'relevance',
            type: 'video',
            videoEmbeddable: true,
            videoSyndicated: true
        },
        success: function(result) {
            showPlayList(result)
        }
    });
}

// 보여줌
// 나중에 스크롤 페이징 구현해야됨
function showPlayList(result) {
    let searchModal = document.getElementById("searchModal");
    searchModal.innerHTML = '';
    for (let [k, v] of Object.entries(result.items)) {
        let etag = v.etag;
        let videoId = v.id.videoId;
        let videoTitle = v.snippet.title
        
        let thumbnails = v.snippet.thumbnails.default.url; // default, high, medium

        let tr = document.createElement('tr');
        // tr.addEventListener('click', (e) => {
        //     loadVideoByVideoId(videoId);
        // });

        // image
        let th = document.createElement('th');
        th.setAttribute('scope', 'row');
        // image : th > img
        let img = document.createElement('img');
        img.setAttribute('src', thumbnails);
        img.setAttribute('class', 'mr-3');
        img.setAttribute('alt', 'thumbnails');

        // title tr > td:nth-child(1)
        let td1 = document.createElement('td');
        td1.setAttribute('class', 'text-left');
        td1.innerHTML = videoTitle;

        // button
        let td2 = document.createElement('td');
        td2.addEventListener('click', (event) => {
            event.cancelBubble=true
        });
        // button : tr > td:nth-child(2) > button
        let button = document.createElement('button');
        button.setAttribute('class', 'btn');
        button.addEventListener('click', () => {
            addMusicList(videoTitle, videoId);
        });
        // button icon : tr > td:nth-child(2) > button > i
        let buttonIcon = document.createElement('i');
        buttonIcon.setAttribute('class', 'fa fa-plus');

        th.appendChild(img);
        button.appendChild(buttonIcon);
        td2.appendChild(button);

        searchModal.appendChild(tr);
        tr.appendChild(th);
        tr.appendChild(td1);
        tr.appendChild(td2);
    }
}
// 클릭하면 나오게 하는거
function loadVideoByVideoId(videoIndex, videoId) {
    nowPlayingIndex = videoIndex;
    nowPlayingVideoId = videoId;
    player.loadVideoById({
        videoId: nowPlayingVideoId
    })
}
// 재생목록에 추가
function addMusicList(videoTitle, videoId) {
    let musicList = document.getElementById('musicList');

    let tr = document.createElement('tr');
    tr.addEventListener('click', (e) => {
        loadVideoByVideoId(e.target.parentNode.childNodes[0].innerHTML - 1, videoId);
    });
    tr.setAttribute('id', videoId);

    let th = document.createElement('th');
    th.setAttribute('scope', 'row');

    let td1 = document.createElement('td');
    td1.setAttribute('class', 'text-left');
    td1.innerHTML = videoTitle

    let td2 = document.createElement('td');
    td2.addEventListener('click', (event) => {
        event.cancelBubble=true
    });
    let button = document.createElement('button');
    button.setAttribute('class', 'btn');
    let buttonIcon = document.createElement('i');
    buttonIcon.setAttribute('class', 'fa fa-trash');

    button.appendChild(buttonIcon);
    td2.appendChild(button);

    musicList.appendChild(tr);
    tr.appendChild(th);
    tr.appendChild(td1);
    tr.appendChild(td2);

    resetIndex();
    saveAllMusicList();
}

// 삭제 구현
function deletePlayList(index) {
    document.getElementById('musicList').deleteRow(index);
    resetIndex();
    saveAllMusicList();
}

// 번호 다시 맥이기
function resetIndex() {
    let musicList = document.querySelectorAll('#musicList > tr');
    for (let [k, v] of Object.entries(musicList)) {
        let key = parseInt(k);
        v.querySelectorAll('th')[0].textContent = key + 1;
        const oldTrashButton = v.querySelectorAll('td > button')[0];
        const newTrashButton = oldTrashButton.cloneNode(true);
        newTrashButton.addEventListener('click', () => {
            deletePlayList(key);
        });
        oldTrashButton.parentNode.replaceChild(newTrashButton, oldTrashButton);
    }
}
// LOCAL STORAGE에 집어넣음
// 되게 비효율적이긴하지만 구현이 우선이다..
function saveAllMusicList() {
    let HTMLMusicList = document.querySelectorAll('#musicList > tr');
    musicList = []
    for (let [k, v] of Object.entries(HTMLMusicList)) {
        let videoId = v.id;
        let videoTitle = v.querySelectorAll('td')[0].textContent;
        musicList.push({
            "videoId": videoId,
            "videoTitle": videoTitle
        })
    }
    
    //setCookie('musicList', JSON.stringify(musicList), 365)
    localStorage.setItem('musicList',JSON.stringify(musicList))
}

// function addYouTubePlayList(){
//     let playLists = []
//     for (const [key, val] of Object.entries(musicList)) {
//         playLists.push(val.videoId)
//     }
//     player.loadPlaylist({
//         'playlist': playLists
//     })
// }

/*
function setCookie(cname, cvalue, exp) {
    let date = new Date();
    date.setTime(date.getTime() + (exp * 24 * 60 * 60 * 1000));
    document.cookie = cname + '=' + cvalue + ';expires=' + date.toUTCString() + ';path=/';
}

function getCookie(cname) {
    let value = document.cookie.match('(^|;) ?' + cname + '=([^;]*)(;|$)');
    return value ? value[2] : null;
};

*/
function musicListSaveCheck() {
    // let storedMusicList = JSON.parse(getCookie('musicList'));
    let storedMusicList = JSON.parse(localStorage.getItem('musicList'));
    if(localStorage.getItem('repeatStatus') == "true"){
        console.log(localStorage.getItem('repeatStatus'))
        repeatStatus = true
        repeatBtn.style.color = '#cc3232'
    }
    if(localStorage.getItem('shuffleStatus') == "true"){
        shuffleList()
        shuffleStatus = true
        shuffleBtn.style.color = '#cc3232'
    }
    if (storedMusicList == null || storedMusicList == '') {} else {
        for (let index in storedMusicList) {
            musicList.push({
                "videoId": storedMusicList[index].videoId,
                "videoTitle": storedMusicList[index].videoTitle
            })
            addMusicList(storedMusicList[index].videoTitle, storedMusicList[index].videoId);
        }
        //addYouTubePlayList();
        return true;
    }
    
    return false;
}

function playFirst(){
    // 순차 섞여있으면
    if(shuffleBtn.style.color != ""){
        nowPlayingIndex = 0;
        nowPlayingVideoId = shuffledMusicList[nowPlayingIndex].videoId;
        loadVideoByVideoId(nowPlayingIndex, nowPlayingVideoId)
    } else {
        nowPlayingIndex = 0;
        nowPlayingVideoId = musicList[nowPlayingIndex].videoId;
        loadVideoByVideoId(nowPlayingIndex, nowPlayingVideoId)
    }
}

function playPrev(){

    if(nowPlayingIndex <= 0){
        nowPlayingIndex = 0
    } else {
        nowPlayingIndex--
    }

    if(shuffleBtn.style.color != ""){
        nowPlayingVideoId = shuffledMusicList[nowPlayingIndex].videoId;
        loadVideoByVideoId(nowPlayingIndex, nowPlayingVideoId)
    } else {
        nowPlayingVideoId = musicList[nowPlayingIndex].videoId;
        loadVideoByVideoId(nowPlayingIndex, nowPlayingVideoId)
    }
}

// 다음곡 재생
function playNext(){
    // 순서 섞여있을 때
    if(shuffleBtn.style.color != ""){
        // 재생할 다음곡이 있다면
        if(nowPlayingIndex < shuffledMusicList.length - 1){
            nowPlayingIndex++;
            nowPlayingVideoId = shuffledMusicList[nowPlayingIndex].videoId;
            loadVideoByVideoId(nowPlayingIndex, nowPlayingVideoId)
            // 반복상태
        } else {
            if(repeatBtn.style.color != ""){
                nowPlayingIndex = 0;
                nowPlayingVideoId = shuffledMusicList[nowPlayingIndex].videoId;
                loadVideoByVideoId(nowPlayingIndex, nowPlayingVideoId);
            }
        }
    } else {
        if(nowPlayingIndex < musicList.length - 1){
            nowPlayingIndex++;
            nowPlayingVideoId = musicList[nowPlayingIndex].videoId;
            loadVideoByVideoId(nowPlayingIndex, nowPlayingVideoId)
            // 반복상태
        } else {
            if(repeatBtn.style.color != ""){
                nowPlayingIndex = 0;
                nowPlayingVideoId = musicList[nowPlayingIndex].videoId;
                loadVideoByVideoId(nowPlayingIndex, nowPlayingVideoId);
            }
        }
    }
}

function playLast(){
    if(shuffleBtn.style.color != ""){
        nowPlayingIndex = shuffledMusicList.length - 1;
        nowPlayingVideoId = shuffledMusicList[nowPlayingIndex].videoId;
        loadVideoByVideoId(nowPlayingIndex, nowPlayingVideoId)
    } else {
        nowPlayingIndex = musicList.length - 1;
        nowPlayingVideoId = musicList[nowPlayingIndex].videoId;
        loadVideoByVideoId(nowPlayingIndex, nowPlayingVideoId)
    }
}

function nowPlayingMusic(){
    console.log(this.player)
}

function shuffleList(){
    shuffledMusicList = musicList;
    for (let i = shuffledMusicList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledMusicList[i], shuffledMusicList[j]] = [shuffledMusicList[j], shuffledMusicList[i]];
    }
}

function exportList(){

}

function importList(){

}

// 반복
repeatBtn.addEventListener('click', (e) => {
    if(e.target.style.color != ""){
        repeatStatus = false
        repeatBtn.removeAttribute('style')
    } else {
        repeatStatus = true
        repeatBtn.style.color = '#cc3232'
    }
    localStorage.setItem('repeatStatus',repeatStatus)
});

// 섞기
shuffleBtn.addEventListener('click', (e) => {
    if(e.target.style.color != ""){
        shuffleStatus = false
        shuffleBtn.removeAttribute('style')
    } else {
        shuffleList()
        shuffleStatus = true
        shuffleBtn.style.color = '#cc3232'
    }
    localStorage.setItem('shuffleStatus',shuffleStatus)
});
