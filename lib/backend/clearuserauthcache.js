var pronto = require('pronto');
var crypto = require('crypto');
var util = require('../http/util');

/**
 * This command clears the user auth cache (against memcache) for cached auth
 * information.
 *
 * Params:
 * - endpoint: URL to the IdentityServices endpoint. (REQUIRED)
 * - projectId: The project (tenant) ID. (OPTIONAL)
 */

function ClearUserAuthCache(){}
pronto.inheritsCommand(ClearUserAuthCache);
module.exports = ClearUserAuthCache;

ClearUserAuthCache.prototype.execute = function(cxt, params) {

	var memcached = cxt.getDatasource('memcached');
	var req = cxt.getDatasource('request');
	var endpoint = params.endpoint || '';

	var cmd = this;

	if (req.headers.authorization) {
		var user = util.userFromAuthString(req.headers.authorization);
		if (user) {
			var shasum = crypto.createHash('sha1');
			shasum.update(user.name + user.pass + endpoint + params.projectId);
			var cacheId = shasum.digest('hex');
			var mcstart = Date.now();
			memcached.get(cacheId, function(err, result) {
				cxt.log("%d ms: ClearUserAuthCache Get(memcached)", Date.now() - mcstart, "custom");
				if (result) {
					var mcstart = Date.now();
					memcached.delete(cacheId, function(err, result) {
						cxt.log("%d ms: ClearUserAuthCache Delete(memcached)", Date.now() - mcstart, "custom");
						if (err) {
			        // In case of an error we log it. Log all the things!
			        var date = new Date().toUTCString();
			        cxt.log("\033[1;35m[%s]\033[0m Error deleting %s from memcached. Message: %s", date, cacheId, err, "debug");
			      }
			      else {
			      	cxt.log("Removed cacheId: %s", cacheId, "debug");
			      }
			      cmd.done();
					});
				}
				else {
					cmd.done();
				}
			});
		}
		else {
			this.done();
		}
	}
	else {
		this.done();
	}

}