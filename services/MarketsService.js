var util = require('util');
var EventEmitter = require('events').EventEmitter;
var request = require('request');
var _ = require('lodash');
var Common = require('../lib/common');

function MarketsService(options) {

    this.common = new Common({log: options.node.log});

    this.info = {
        price_usd: 0,
        price_btc: 0,
        market_cap_usd: 0,
		available_supply: 0,
		"24h_volume_usd": 0,
		percent_change_24h:0
    };

    this._updateInfo();

    var self = this;

    setInterval(function () {
        self._updateInfo();
    }, 90000);

}

util.inherits(MarketsService, EventEmitter);

MarketsService.prototype._updateInfo = function() {
    var self = this;
    return request.get({
        url: 'https://api.bitmesh.com/?api=market.statistics&params={"market":"btc_xrd"}',
        json: true
    }, function (err, response, body) {

        if (err) {
            return self.common.log.error('bitmesh api error', err);
        }

        if (!body.success) {
            return self.common.log.error('bitmesh api error response', body);
        }

        if (body) {
            var needToTrigger = false;

            self.info.price_usd = parseFloat(body.data.value);
            self.info.price_btc = parseFloat(body.data.price);
            self.info.market_cap_usd = 0;
            self.info['24h_volume_usd'] = parseFloat(body.data.price) * parseFloat(body.data.volume);
            self.info.percent_change_24h = parseFloat(body.data.change);
            needToTrigger = true;

            if (needToTrigger) {
                self.emit('updated', self.info);
            }

            return self.info;
        }

        return self.common.log.error('bitmesh api error body', body);

    });

};

MarketsService.prototype.getInfo = function(next) {
    return next(null, this.info);
};

module.exports = MarketsService;
