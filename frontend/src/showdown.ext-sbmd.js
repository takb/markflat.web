import showdown from 'showdown'

showdown.extension('sbmd', function () {
  var artist = {
    type: 'lang',
    regex: /(# .*?)\s-\s(.*)$/mg,
    replace: '$1<span class="sbmd-artist"> - $2</span>'
  };
  var elements = {
    type: 'lang',
    filter: function (text, converter) {
      return text.replace(/~(.*?)[ \t]+([\s\S ]*?)(?=~|^\d+\. |^$)/mg, function(match, block, content) {
        return '<ul><li list="'+block+'">'+converter.makeHtml(content).replace(/<\/?p>/g, '')+'</li></ul>';
      });
    }
  };
  var chords = {
    type: 'lang',
    filter: function (text, converter) {
      return text.replace(/\{(.+?)\}([a-zA-Z' ]|_[a-zA-Z ]_|\.|$)/g, function(match, p1, p2) {
        var chord = p1.replace(/^([a-gA-G][#b]?m?)(.*?)(?:\/([a-gA-G][#b]?))?$/g, function(match, key = '', modifier = '', bass = '') {
          if (typeof converter.transpose == 'function') {
            key = converter.transpose(key);
            bass = converter.transpose(bass);
          }
          key = converter.addMinorChordMarker ? key.replace(/^([a-g][#b]?(?!m))$/, '$1'.toUpperCase()+'m') : key;
          // key = key.replace(/#/g, '\u266F').replace(/(?!^)b/g, '\u266D');
          modifier = modifier.replace(/(\d+)\+/g, 'maj$1').replace(/^.(2|4)$/g, 'sus$1');//.replace(/#/g, '\u266F').replace(/b/g, '\u266D');
          // bass = bass.replace(/#/g, '\u266F').replace(/([a-gA-G])b/g, '$1\u266D');
          return key+(modifier ? '<sup>'+modifier+'</sup>' : '')+(bass ? '<sub>/'+bass+'</sub>' : '');
        });
        var base = (p2 != '.') ? p2.replace(' ', '&nbsp;&nbsp;&nbsp;') : '';
        return base ? '<span class="sbmd-ca"><span class="sbmd-chord">'+chord+'</span>'+base+'</span>' : '<span class="sbmd-chord-inline">'+chord+'</span>';
      })
      .replace(/\{(\.\.\.|:?\|\|?:?|')\}([a-zA-Z ]|_[a-zA-Z ]_|\.|$)/g, function (match, tag, p2) {
        var base = (base != '.') ? p2.replace(' ', '&nbsp;&nbsp;&nbsp;') : '';
        return base ? '<span class="sbmd-ca"><span class="sbmd-chord">'+tag+'</span>'+base+'</span>' : '<span class="sbmd-chord-inline">…</span>';
      });
    }
  };
  var styling = {
    type: 'output',
    filter: function (text, converter) {
      var zoom = converter.zoom != undefined && converter.zoom > 0 ? '<style>body {font-size: '+converter.zoom+'%;}</style>' : '';
      return converter.style + zoom + text.replace(/<li(.*?)>([\s\S]*?)<\/li>/g, function (match, tag, content) {
        var addClass = content.match(/class="sbmd-ca"/) ? ' class="sbmd-has-chords"' : '';
        return '<li'+addClass+tag+'>'+content+'</li>';
      });
    }
  };
  return [artist, elements, chords, styling];
});
showdown.addMinorChordMarker = false;
showdown.transposeby = 0;
showdown.transpose = function(key) {
  if (key && this.transposeby != undefined && this.transposeby != 0) {
    var isMinor = key.match(/^[a-g]/);
    var scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    if (key.length > 1 && key[key.length - 1] == 'b') {
      scale = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    }
    key = key.length > 1 ? key[0].toUpperCase() + key.substr(1, key.length - 1) : key.toUpperCase();
    if (scale.indexOf(key) >= 0) {
      var i = (scale.indexOf(key) + this.transposeby) % scale.length;
      key = scale[ i < 0 ? i + scale.length : i ];
      if (isMinor) {
          key = key.toLowerCase();
      }
    }
  }
  return key;
};
showdown.style = `<style>
  em {
    font-style: normal;
    text-decoration: underline;
  }

  h1 {
    position: relative;
    color: #333;
    font-size: 1.4em;
  }

  .sbmd-artist {
    float: right;
    font-size: 0.9em;
  }

  ul, ol {
    margin: 0;
    padding: 0 0 0 4.4em;
    color: #333;
  }

  ul {
    list-style: none;
  }

   ul li, ol li {
    margin: 6 0;
    line-height: 1.2em;
  }

  ul li::before {
    position: absolute;
    width: 4.2em;
    left: 0;
    content: attr(list);
    text-align: right;
  }

  .sbmd-ca {
    position: relative;
  }

  .sbmd-chord {
    position: absolute;
    font-size: 0.9em;
    bottom: 0.6em;
  }

  .sbmd-chord, .sbmd-chord-inline {
    font-weight: bold;
    white-space: nowrap;
  }

  .sbmd-chord sup {
    font-size: 0.6em;
  }

  .sbmd-has-chords {
    line-height: 1.9em;
  }
</style>`;
