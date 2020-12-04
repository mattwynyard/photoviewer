import L from 'leaflet'

L.MediaPlayerControl = L.Control.extend({
        options: {
          position: 'bottomright'
        },
        counter: 0,
      
    onAdd: function () {
        this.media = L.DomUtil.create('div', 'player', L.DomUtil.get('map'));
    },

    setData: function(data) {
        this.data = data;
    },

    setAmazon: function(amazon) {
        this.amazon = amazon;
    },

    setURL: function() {
        this.url = this.amazon + this.data[this.counter].photo;
    }
});

L.mediaPlayerControl = () => {
    return new L.MediaPlayerControl();
};