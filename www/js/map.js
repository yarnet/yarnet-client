$(function() {

  //マーカー変数用意
  var marker;
  var marker_gps;

  // ボタンに指定したid要素を取得
  var button = $("#map_button");

  // ボタンが押された時の処理
  button.on('click', function() {
    // フォームに入力された住所情報を取得
    var address = $("#address").val();
    // 取得した住所を引数に指定してcodeAddress()関数を実行
    codeAddress(address);
  });

  //読み込まれたときに地図を表示
  $(window).on('load', function(){
    // フォームに入力された住所情報を取得
    var address = $("#address").val();
    // 取得した住所を引数に指定してcodeAddress()関数を実行
    codeAddress(address);
  });

  $('#map-content').on('show.start', function() {
    $('[data-toggle="transition"], [data-toggle="logout"]', '#menu-circle').parent().remove();

    if (localStorage['auth']) {
      $('#menu-circle').append(
        $('<li class="circleMenu-item">').append(
          $('<button type="button" class="btn btn-primary" title="ログアウト" data-toggle="logout">').append(
            $('<i class="fas fa-sign-out-alt"></i>')
          )
        )
      );
    } else {
      $('#menu-circle').append(
        $('<li class="circleMenu-item">').append(
          $('<button type="button" class="btn btn-primary" title="ログイン" data-toggle="transition" data-target="#signin-content">').append(
            $('<i class="fas fa-user"></i>')
          )
        )
      );
      $('#menu-circle').append(
        $('<li class="circleMenu-item">').append(
          $('<button type="button" class="btn btn-primary" title="新規登録" data-toggle="transition" data-target="#signup-content">').append(
            $('<i class="fas fa-user-plus"></i>')
          )
        )
      );
    }

    $('#menu-circle').circleMenu('init');
  });

  $(document).on('click', '[data-toggle="logout"]', function() {
    var state = history.state.slice(0);
    state.pop();
    history.replaceState(state, false);

    localStorage.removeItem('auth');
    alert('ログアウトしました。');
    $('#top-content').transition('fadeOut', 'fadeIn');
  });

  //マップクリック時に半径3km内のホテルを検索
  var markers = [];
  var infowindows = [];
  YarNet.map.addListener('click', function(e){
    var x= e.latLng.lat();
    var y= e.latLng.lng();
    var hotelspot_url='https://app.rakuten.co.jp/services/api/Travel/VacantHotelSearch/20170426?applicationId=1094029776062152274&datumType=1&searchRadius=3.0&latitude=' + x + '&longitude='+y;
    console.log(hotelspot_url);
    getHotel(hotelspot_url);
  });

  // ホテルの位置
  function getHotel(url) {
    markers.forEach(m => m.setMap(null));
    markers.splice(0, markers.length);
    infowindows.splice(0,infowindows.length);

    //開始時刻
    var startTime = new Date();

    $.ajax({
      url:url,
      type:'GET',
      dataType:'json',
      error:function(){
        console.log("miss");
      },
      success:function(data){
        //終了時刻
        var endTime = new Date();
        console.log(endTime.getTime() - startTime.getTime()+"/1000秒 楽天トラベルのurlリクエストに掛かった時間");

        //contactタブのホテル画像をクリア
        $('#hotel_info').empty();

        data.hotels.forEach(hotel => {
          var hotelInfo_url = "";
          var hotelPosition = {
            lat:hotel.hotel[0].hotelBasicInfo.latitude,
            lng:hotel.hotel[0].hotelBasicInfo.longitude
          };
          var marker = new google.maps.Marker({
            position:hotelPosition,
            map:YarNet.map,
            icon: './img/hotel-marker.png',
          });
          markers.push(marker);
          var infoWindow = new google.maps.InfoWindow({
            //ホテル名は12文字を超えたら..で省略する
            content:'<div class="infowindow" title="'+hotel.hotel[0].hotelBasicInfo.hotelName+'">'+hotel.hotel[0].hotelBasicInfo.hotelName+'</div>'
            + '電話番号:'+hotel.hotel[0].hotelBasicInfo.telephoneNo+'<br>'
            + '<a href=' + hotel.hotel[0].hotelBasicInfo.hotelInformationUrl+' target="_blank">楽天トラベルページ</a><br>'
            //+"一泊の値段:"+hotel.hotel[0].roomInfo[0].dailyCharge.rakutenCharge+"(円/人)",
          });
          infowindows.push(infoWindow);
          marker.addListener('click',function(){
            infowindows.forEach(i => i.close());
            infoWindow.open(YarNet.map,marker);
          });


          //ホテル検索結果を表示
          var $media = $(
            '<div class="media" style="border-width:1px 0px solid #333333">'+
            '<img src="' + hotel.hotel[0].hotelBasicInfo.hotelImageUrl + '" class="HotelImages" style="text-align:center">'+
            '<div class="media-body">'+
            '<h6 class="mt-0" title="'+hotel.hotel[0].hotelBasicInfo.hotelName+'">'+hotel.hotel[0].hotelBasicInfo.hotelName+'</h6>'+
            '<div class="hotel-address">'+hotel.hotel[0].hotelBasicInfo.address1+hotel.hotel[0].hotelBasicInfo.address2+'</div>'+hotel.hotel[0].hotelBasicInfo.telephoneNo+
            '</div></div>'
          ).appendTo($("#hotel_info"));

          //ホテル名クリックでマップの中心移動、mouseEnterで跳ねる
          $('img', $media).on('click',function(){
            window.open(hotel.hotel[0].hotelBasicInfo.hotelInformationUrl,'_blank');
          });

          $('.media-body',$media).on('mouseenter', function() {
            marker.setAnimation(google.maps.Animation.BOUNCE);
          });
          $('.media-body',$media).on('mouseleave', function() {
            marker.setAnimation(null);
          });
          //クリックして中心を移動
          $('.media-body',$media).on('click', function() {
            YarNet.map.panTo(marker.position);
          });
        });
      }
    });
  }

var select_location;
  // マップをクリックで位置変更
  YarNet.map.addListener('click', function(e) {
if(your_location!=null || select_location!=null){
    calcDistance(e);
  }
    // 住所を取得
    var address = e.placeId;
    room = peer.joinRoom(address);

    chatlog('<i>' + address + '</i>に入室しました');

    // チャットを受信
    room.on('data', function(data){
      chatlog('ID: ' + data.src + '> ' + data.data); // data.src = 送信者のpeerid, data.data = 送信されたメッセージ
    });

    var service = new google.maps.places.PlacesService(YarNet.map);
    service.getDetails({placeId: address}, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        $("#address").val(results.name);
          $('#search_form').submit();
      }
    });
  });


  $('#search_form').on('submit', function(){ //クリックしたら
    $('#nav-twitter .tweet').remove();

    if ($('#nav-twitter-tab').hasClass('active')) {
      $.getJSON('https://api.yarnet.ml/tweets', {'q': $("#address").val()}).done(function(tweets) {
        if (!$('#nav-twitter-tab').hasClass('active')) return;

        console.log(tweets);
        tweets.forEach(tweet => {
          console.log(tweet);

          var $article = $('.tweet-template')
            .clone(true)
            .removeClass('tweet-template')
            .addClass('tweet');

          $('.profile-img', $article).attr('src', tweet.user_profile_img);
          $('.user-name', $article).text(tweet.user_name);
          $('.screen-name', $article).text(tweet.user_screem_name);
          $('.date', $article).text(tweet.date);
          $('.body', $article).text(tweet.body);

          var $photos = $('.tweet-body', $article).addClass('photos_' + tweet.photos.length);

          for (var i = 0; i < tweet.photos.length; i++) {
            var $wrapper = $('<div>').addClass('photos_img_wrapper_' + i);
            $wrapper.append(
              $('<a>')
                .attr('href', tweet.photos[i])
                .attr('data-lightbox', 'image-' + tweet.id)
                .attr('data-title', '')
                .append(
                  $('<img>')
                    .attr('src', tweet.photos[i])
                )
            );

            $photos.append($wrapper);
          }

          $('#nav-twitter').append($article);
        });
      });
    }

    if ($('#nav-wikipedia-tab').hasClass('active')) {
      WikipediaAPI();
    }

    return false;
  });

  //右ドロワー
  WindowHeight = $(window).height();
  $('.right-nav-drawer').css('height', WindowHeight); //メニューをwindowの高さいっぱいにする

  $('#right-btn').click(function(){ //クリックしたら
    if($('.right-nav-drawer').is(":animated")){
      return false;
    }else{
      $('.right-nav-drawer').animate({width:'toggle'}); //animateで表示・非表示
      $(this).toggleClass('peke'); //toggleでクラス追加・削除
      return false;
    }
  });

  //別領域をクリックでメニューを閉じる
  $(document).click(function(event) {
    if (!$(event.target).closest('.right-nav-drawer').length) {
      $('#right-btn').removeClass('peke');
      $('.right-nav-drawer').hide();
    }
  });

  //Circle Menu
  $('#menu-circle').circleMenu({
    item_diameter: 40,
    circle_radius: 100,
    direction: 'bottom-left'
  });

  $('.left-drawer .nav-link').on('shown.bs.tab', function() {
    $('#search_form').submit();
  });

  function codeAddress(address) {
    // google.maps.Geocoder()コンストラクタのインスタンスを生成
    var geocoder = new google.maps.Geocoder();

    // geocoder.geocode()メソッドを実行
    geocoder.geocode( { 'address': address}, function(results, status) {

      // ジオコーディングが成功した場合
      if (status == google.maps.GeocoderStatus.OK) {

        // 変換した緯度・経度情報を地図の中心に表示
        YarNet.map.setCenter(results[0].geometry.location);

        //☆表示している地図上の緯度経度
        //document.getElementById('lat').value=results[0].geometry.location.lat();
        //document.getElementById('lng').value=results[0].geometry.location.lng();

        // マーカー設定
        marker = new google.maps.Marker({
          map: YarNet.map,
          position: results[0].geometry.location
        });

        // ジオコーディングが成功しなかった場合
      } else {
        console.log('Geocode was not successful for the following reason: ' + status);
      }

    });

  }



  function getClickLatLng(lat_lng, map) {

    //☆表示している地図上の緯度経度
    //document.getElementById('lat').value=lat_lng.lat();
    //document.getElementById('lng').value=lat_lng.lng();

    // マーカーを設置
    if (marker) marker.setMap(null);
    marker = new google.maps.Marker({
      position: lat_lng,
      map: map
    });

    // 座標の中心をずらす
    map.panTo(lat_lng);
  }

  //距離測定
  function calcDistance(e){
    getClickLatLng(e.latLng, YarNet.map);
    select_location=[e.latLng.lat(),e.latLng.lng()];
    //現在地と検索地両方あれば距離を測定
    if(your_location!=null || select_location!=null){
      var pos =[
        new google.maps.LatLng(your_location[0],your_location[1]),
        new google.maps.LatLng(select_location[0],select_location[1])
      ];
      var distance = google.maps.geometry.spherical.computeLength(pos);
      //1kmより長い場合
      if(distance>=1000){
        console.log((distance/1000).toFixed(1)+"km");
      }else{
        console.log(distance.toFixed(1)+"m");
      }
    }
  }


  //wiki
  function WikipediaAPI() {
    //検索語
    var query = $('#address').val();
    //API呼び出し
    $.ajax({
      url: 'http://wikipedia.simpleapi.net/api',
      data: {
        output: 'json',
        keyword: query
      },
      type: 'GET',
      dataType: 'jsonp',			//Access-Control-Allow-Origin対策
      timeout: 1000,
      success: function(json) {
        if (json != null && json.length > 0) {
          $('#word').html('');
          //結果表示
          for (i = 0; i < json.length; i++) {
            $('#word').append(
              '<dt>' + (i + 1) + '：<a href="' +
              json[i].url + '">' +
              json[i].title + '</a>' +
              '&nbsp;(' + json[i].datetime +
              ' 更新)</dt>' +
              '<dd>' + json[i].body + '</dd>'
            );
          }
        } else {
          $('#word').html('検索結果なし');
        }
      }
    });
  }

  var your_location;
  var onSuccess = function(position) {

    your_location=[position.coords.latitude,position.coords.longitude];
    alert('Latitude: '          + position.coords.latitude          + '\n' +
          'Longitude: '         + position.coords.longitude         + '\n' +
          'Altitude: '          + position.coords.altitude          + '\n' +
          'Accuracy: '          + position.coords.accuracy          + '\n' +
          'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
          'Heading: '           + position.coords.heading           + '\n' +
          'Speed: '             + position.coords.speed             + '\n' +
          'Timestamp: '         + position.timestamp                + '\n');

    YarNet.map.setCenter({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });

    // マーカーを設置
    if (marker) marker.setMap(null);
    marker = new google.maps.Marker({
      position: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      map: YarNet.map
    });

    // 座標の中心をずらす
    YarNet.map.panTo({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });

    var hotelspot_url = 'https://app.rakuten.co.jp/services/api/Travel/VacantHotelSearch/20170426?applicationId=1094029776062152274&datumType=1&searchRadius=3.0&latitude=' + position.coords.latitude + '&longitude=' + position.coords.longitude;
    getHotel(hotelspot_url);
  };







  //エラーのコールバック
  var onError = function(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
  }

  $("#eventButton").on("click", function() {
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {enableHighAccuracy: true});
  });

  $('.left-drawer-toggle').on('click', function() {
    $('<div>').addClass('drawer-backdrop')
      .appendTo('#map-content');
    $('.left-drawer').toggleClass('show');

    // 開くと同時に検索する。
    $('#search_form').submit();
  });

  $(document).on('click', '.drawer-backdrop', function() {
    $('.left-drawer').removeClass('show');
    $(this).remove();
  });

});
