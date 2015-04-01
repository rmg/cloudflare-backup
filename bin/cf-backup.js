#!/usr/bin/env node

var fmt = require('util').format;
var https = require('https');
var qs = require('querystring');

var email = process.env.CF_EMAIL;
var token = process.env.CF_TOKEN;
if (!email || !token) {
  console.error('CF_EMAIL and CF_TOKEN must be set');
  return process.exit(1);
}

getZones(function(err, zones) {
  if (err) {
    return console.error(err);
  }
  zones.forEach(dumpZone);
});

function dumpZone(zone) {
  allPages('/zones/' + zone.id + '/dns_records', function(err, recs) {
    if (err) {
      return console.error('Error getting zone records for %s:', zid, err);
    }
    console.log(';; Domain: %s', zone.name);
    console.log(';; Exported: %s', new Date());
    console.log('$ORIGIN %s.', zone.name);
    recs.forEach(function(rec) {
      console.log(bindFormat(rec));
    });
    console.log('\n');
  });
}

function bindFormat(rec) {
  var content = rec.content;
  switch(rec.type) {
    case 'SPF':
    case 'TXT':
      content = JSON.stringify(content);
      break;
    case 'CNAME':
      content += '.';
      break;
    case 'MX':
      content = fmt('%d\t%s.', rec.priority, content);
      break;
  }
  return fmt('%s.\t%d\tIN\t%s\t%s', rec.name, rec.ttl, rec.type, content);
}

function getZones(callback) {
  allPages('/zones', function(err, res) {
    callback(err, res);
  });
}

function allPages(path, callback) {
  var collection = [];
  return getPage(1);

  function getPage(page) {
    var params = {
      per_page: 50,
      page: page,
    };

    cfReq(path, params, function handlePage(err, res) {
      if (err) {
        return callback(err);
      }
      if (res.result) {
        collection = collection.concat(res.result);
      }
      if (hasMorePages(res.result_info)) {
        return getPage(res.result_info.page + 1);
      } else {
        return callback(err, collection);
      }
    });
  }
}

function hasMorePages(info) {
  if (!info) {
    return false;
  }
  var seen = (info.page - 1) * info.per_page + info.count;
  return seen < info.total_count;
}

function cfReq(path, params, callback) {
  var opts = {
    host: 'api.cloudflare.com',
    port: 443,
    path: '/client/v4' + path + '?' + qs.stringify(params),
    headers: {
      'X-Auth-Email': email,
      'X-Auth-Key': token,
    },
    method: 'GET',
  };
  var req = https.request(opts, function(res) {
    return JSONResponse(res, callback);
  });
  req.end();
  return req;
}

function JSONResponse(res, callback) {
  var body = '';

  res.on('data', accumulate)
     .on('end', parse)
     .on('error', callback);

  function accumulate(buf) {
    body += buf;
  }

  function parse() {
    var err = null;
    try {
      body = JSON.parse(body);
    } catch (e) {
      err = e;
    }
    callback(err, body);
  }
}
