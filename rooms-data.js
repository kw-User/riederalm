// Shared rooms data (matches formular Zimmer picker) + card renderer
(function(){
  var ROOMS = [
    { name: 'Wohnkomfort-Doppelzimmer Baumtraum', img: 'media/room-001.jpg', guests: 2, size: 32, price: 189, desc: 'Lichtdurchflutetes Doppelzimmer mit Südbalkon und warmen Holztönen. Großzügige Regendusche inklusive.' },
    { name: 'Panoramazimmer Deluxe', img: 'media/room-002.jpg', guests: 2, size: 34, price: 215, desc: 'Elegantes Doppelzimmer mit raumhoher Fensterfront und freiem Blick auf die Leoganger Steinberge.' },
    { name: 'Komfortzimmer Heimat', img: 'media/room-003.jpg', guests: 2, size: 28, price: 175, desc: 'Das kleine Refugium für zwei: alpiner Chic, Ostbalkon und ein gemütlicher Lesesessel.' },
    { name: 'Penthouse & Komfortzimmer die Pinzgauerin', img: 'media/pinzgauerin.png', guests: 2, size: 30, price: 199, desc: 'Charmantes Komfortzimmer, auf Wunsch als Penthouse mit Dachterrasse. Pinzgauer Holzwerk trifft Moderne.' },
    { name: 'Doppelzimmer Spielberg', img: 'media/room-005.jpg', guests: 2, size: 27, price: 169, desc: 'Klassisches Doppelzimmer mit Südbalkon, Kingsize-Bett und stilvollem Bad.' },
    { name: 'Suite Alpenglühen', img: 'media/room-006.jpg', guests: 2, size: 48, price: 269, desc: 'Großzügige Suite mit offenem Wohnbereich, Kaminofen und separatem Schlafzimmer.' },
    { name: 'Juniorsuite Almfeuer', img: 'media/room-007.jpg', guests: 2, size: 42, price: 245, desc: 'Juniorsuite mit gemütlicher Wohnlandschaft, separatem Schlafbereich und Elektrokamin.' },
    { name: 'Juniorsuite Bergglück', img: 'media/room-008.jpg', guests: 2, size: 44, price: 249, desc: 'Helle Juniorsuite mit freistehender Badewanne direkt am Panoramafenster.' },
    { name: 'Juniorsuite & Penthouse-Suite Der Pinzgauer', img: 'media/room-009.jpg', guests: 2, size: 52, price: 289, desc: 'Wahlweise als Juniorsuite oder Penthouse-Suite mit privater Terrasse und regionalen Details.' },
    { name: 'Juniorsuite Spielberg', img: 'media/room-010.jpg', guests: 2, size: 45, price: 255, desc: 'Juniorsuite mit umlaufendem Balkon und Panoramablick auf das Leoganger Tal.' },
    { name: 'Luxury Spa Penthouse Leogang', img: 'media/room-001.jpg', guests: 2, size: 65, price: 389, desc: 'Exklusive Penthouse-Suite mit privatem Spa, finnischer Sauna und freistehender Badewanne.' },
    { name: 'Suite Himmelreich', img: 'media/room-002.jpg', guests: 2, size: 55, price: 309, desc: 'Exklusive Dachsuite mit eigener Sauna, großer Terrasse und Blick bis zum Asitz.' },
    { name: 'Suite Landleben', img: 'media/room-003.jpg', guests: 2, size: 50, price: 279, desc: 'Traditionelle Landhaus-Suite mit Pinzgauer Möbeln, Kachelofen und Loggia.' },
    { name: 'Good Life Suite', img: 'media/room-004.jpg', guests: 2, size: 58, price: 319, desc: 'Signature-Suite mit offenem Grundriss, privater Sauna und Panoramaterrasse.' },
    { name: 'Family Suite Deluxe Leogang', img: 'media/room-005.jpg', guests: 4, size: 55, price: 299, desc: 'Familien-Suite mit getrennten Schlafzimmern, großem Wohnraum und Südbalkon.' },
    { name: 'Family Suite Deluxe Birnhorn', img: 'media/room-006.jpg', guests: 4, size: 58, price: 315, desc: 'Großzügige Familien-Suite mit zwei Schlafzimmern, Wohn-Essbereich und Balkon.' },
    { name: 'Familienstudio Stoaberg', img: 'media/room-007.jpg', guests: 4, size: 42, price: 235, desc: 'Familienstudio mit offenem Wohnraum, Eltern-Schlafnische und Stockbett für die Kleinen.' },
    { name: 'Familien-Suite Der Salzburger', img: 'media/room-008.jpg', guests: 5, size: 75, price: 395, desc: 'Unsere größte Familien-Suite mit zwei Bädern, separaten Kinderzimmern und viel Platz.' }
  ];

  function shuffle(arr){
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* Pick up to `count` rooms from shuffled pool, skipping any that share an
     image with an already-picked room — no duplicate photos in one slider. */
  function pickUnique(pool, count) {
    var shuffled = shuffle(pool);
    var seen = {};
    var picks = [];
    for (var i = 0; i < shuffled.length && picks.length < count; i++) {
      if (!seen[shuffled[i].img]) {
        picks.push(shuffled[i]);
        seen[shuffled[i].img] = true;
      }
    }
    return picks;
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

  function displayName(name){ return name.split('/')[0].trim(); }

  function cardHtml(r, extraClass){
    var n = escapeHtml(displayName(r.name));
    var cls = extraClass ? 'room-card ' + extraClass : 'room-card';
    return '<a href="zimmer-detail.html" class="' + cls + '" style="text-decoration:none;color:inherit;">' +
      '<img src="' + r.img + '" alt="' + n + '" class="room-img">' +
      '<div class="room-card-info"><span class="room-name">' + n + '</span><span class="room-price"><span class="price-label">ab</span><span class="price-value">&euro; ' + r.price + '</span></span></div>' +
      '<div class="room-card-detail-wrapper"><div class="room-card-detail-top"><div class="room-card-detail">' +
        '<div class="room-detail-icons"><span><img src="media/users.svg" alt="">' + r.guests + '</span><span><img src="media/room-m2.svg" alt="">' + r.size + ' m&sup2;</span></div>' +
        '<div class="room-detail-name">' + n + '</div>' +
        '<div class="room-detail-desc">' + escapeHtml(r.desc) + '</div>' +
        '<div class="room-detail-link"><img src="media/type=arrow-right.svg" alt=""><span>Verf&uuml;gbarkeit &amp; Details</span></div>' +
      '</div><div class="room-card-detail-price"><span class="price-label">ab</span><span class="price-value">&euro; ' + r.price + '</span></div></div></div>' +
    '</a>';
  }

  function renderInto(trackId, count, excludeName){
    var track = document.getElementById(trackId);
    if (!track) return;
    var pool = excludeName ? ROOMS.filter(function(r){ return r.name !== excludeName; }) : ROOMS;
    var picks = pickUnique(pool, count || 10);
    track.innerHTML = picks.map(function(r){ return cardHtml(r); }).join('');
  }

  function renderGridInto(containerId, excludeName){
    var el = document.getElementById(containerId);
    if (!el) return;
    var pool = excludeName ? ROOMS.filter(function(r){ return r.name !== excludeName; }) : ROOMS;
    el.innerHTML = pool.map(function(r){ return cardHtml(r, 'reveal'); }).join('');
  }

  function mobileCardHtml(r){
    var n = escapeHtml(displayName(r.name));
    return '<a href="mobile-zimmer-detail.html" class="m-room-card">' +
      '<img src="' + r.img + '" alt="' + n + '" class="m-room-img">' +
      '<div class="m-room-detail">' +
        '<div class="m-room-detail-top">' +
          '<div class="m-room-icons"><span><img src="media/users.svg" alt="">' + r.guests + '</span><span><img src="media/room-m2.svg" alt="">' + r.size + ' m&sup2;</span></div>' +
          '<div class="m-room-price"><span class="price-label">ab</span><span class="price-value">&euro; ' + r.price + '</span></div>' +
        '</div>' +
        '<div class="m-room-name">' + n + '</div>' +
        '<div class="m-room-desc">' + escapeHtml(r.desc) + '</div>' +
        '<div class="m-room-link"><img src="media/type=arrow-right.svg" alt=""><span>Verf&uuml;gbarkeit &amp; Details</span></div>' +
      '</div>' +
    '</a>';
  }

  function renderMobileInto(trackId, count, excludeName){
    var track = document.getElementById(trackId);
    if (!track) return;
    var pool = excludeName ? ROOMS.filter(function(r){ return r.name !== excludeName; }) : ROOMS;
    var picks = pickUnique(pool, count || 10);
    track.innerHTML = picks.map(mobileCardHtml).join('');
  }

  window.RIEDERALM_ROOMS = ROOMS;
  window.RIEDERALM_RENDER_ROOMS = renderInto;
  window.RIEDERALM_RENDER_GRID = renderGridInto;
  window.RIEDERALM_RENDER_MOBILE_ROOMS = renderMobileInto;
})();
