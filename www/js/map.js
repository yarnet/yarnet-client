$(function() {

  //マーカー変数用意
  var marker;

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
  YarNet.map.addListener('click', function(e){
    console.log(e.latLng.lat());
    console.log(e.latLng.lng());
    var x= e.latLng.lat();
    var y= e.latLng.lng();
    var url = 'https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426?applicationId=1094029776062152274&datumType=1&searchRadius=3.0&latitude=' + x + '&longitude='+y;
    console.log(url);

    $.ajax({
      url:url,
      type:'GET',
      dataType:'json',
      error:function(){
        console.log("miss");
      },
      success:function(data){
        data.hotels.forEach(hotel => {
          console.log(hotel.hotel[0].hotelBasicInfo.hotelName);
          console.log(hotel.hotel[0].hotelBasicInfo.latitude);
          console.log(hotel.hotel[0].hotelBasicInfo.longitude);
          console.log("done");
        });
      }
    });

  });




  // マップをクリックで位置変更
  YarNet.map.addListener('click', function(e) {
    getClickLatLng(e.latLng, YarNet.map);

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

  YarNet.map.addListener('center_changed', function() {
    console.log(YarNet.map);
    console.log(marker);
  });

  // ドロワーメニューを開くと同時に検索
  $('#nav-input').on('change', function(e) {
    if (this.checked) $('#search_form').submit();
  });

  WindowHeight = $(window).height();
  $('.drawr').css('height', WindowHeight); //メニューをwindowの高さいっぱいにする

  $('#search_form').on('submit', function(){ //クリックしたら
    $('#nav-content .Tweet_List').remove();

    if ($('#nav-twitter-tab').hasClass('active')) {
      $.getJSON('https://api.yarnet.ml/tweets', {'q': $("#address").val()}).done(function(tweets) {
        if (!$('#nav-twitter-tab').hasClass('active')) return;

        console.log(tweets);
        tweets.forEach(tweet => {
          console.log(tweet);

          $article = $('<article class="Tweet_List">');
          $header = $('<header>');
          $header.append($('<img class ="profile_img">').attr('src', tweet.user_profile_img));//prof img
          $header.append($('<div class ="user_name">').text(tweet.user_name));//userid
          $header.append($('<div class ="screen_name">').text(tweet.user_screem_name));
          $header.append($('<div class ="date">').text(tweet.date));//投稿時刻
          $header.append($('<div class ="body">').text(tweet.body));

          $photos = $('<div class="photos_' + tweet.photos.length + '">');

          for (var i = 0; i < tweet.photos.length; i++) {
            $wrapper = $('<div class="photos_img_wrapper_' + i + '">');
            $wrapper.append($('<a href="' + tweet.photos[i] + '" data-lightbox="image-' + tweet.id + '" data-title=""><img src="' + tweet.photos[i] + '"></a>'));

            $photos.append($wrapper);
          }

          $header.append($photos);
          $article.append($header);

          $('#nav-content').append($article);
        });
      });
    }

    if ($('#nav-wikipedia-tab').hasClass('active')) {
      WikipediaAPI();
    }


    if($('.drawr').is(":animated")){
      return false;
    }else{
      $('.drawr').animate({width:'toggle'}); //animateで表示・非表示
      $(this).toggleClass('peke'); //toggleでクラス追加・削除
      return false;
    }
  });

  //別領域をクリックでメニューを閉じる
  $(document).click(function(event) {
    if (!$(event.target).closest('.drawr').length) {
      $('.search_button').removeClass('peke');
      $('.drawr').hide();
    }
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

  $('#nav-tab .nav-link').on('shown.bs.tab', function() {
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
    marker.setMap(null);
    marker = new google.maps.Marker({
      position: lat_lng,
      map: map
    });

    // 座標の中心をずらす
    map.panTo(lat_lng);
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

});