const axios = require('axios').default;
const CryptoJS = require('crypto-js');
const mariadb = require('mariadb');

exports.constructResponse = (res, code = 200, message) => {
    console.error(message);
    res.statusCode = code;
    res.body = message;
    return res;
}

exports.getPropertyFromDataOrDefault = (data, objKey, fallback = null) => {
    if (data.length > 0) {
        const datum = data[0];
        const key = process.env.PASSKEY;

        if (datum !== null
            && datum[objKey] !== ''
            && key !== null
            && key !== '') {
            try {
                return CryptoJS.AES.decrypt(datum[objKey], key).toString(CryptoJS.enc.Utf8);
            } catch (err) {
                console.warn(`Using fallback value when decrypting ${objKey} with reason ${err}`);
                return fallback;
            }
        }
    }

    return fallback;
}

exports.handler = async (event, context) => {
    const response = {
        headers: {
            'Access-Control-Allow-Origin': `${process.env.ALLOWED_SITE || 'https://ppijerman.org'}`,
            'Access-Control-Allow-Methods': 'GET',
            'Content-Type': 'application/json'
        }
    };

    const tableName = process.env.TABLE_NAME;

    response.data = await mariadb.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        compress: process.env.COMPRESSION_ENABLED === 'true',
        connectTimeout: process.env.TIMEOUT || 0
    }).then(conn => {

        return conn.query(`SELECT *
                           FROM ${tableName}
                           WHERE tstamp = (SELECT MAX(tstamp) FROM ${tableName})`)
            .then(rows => {
                const token = this.getPropertyFromDataOrDefault(rows, 'access_tokens', process.env.ACCESS_TOKEN);
                const tstamp = rows.length > 0 ? new Date(rows[0]['tstamp']) : null;
                const timeout = rows.length > 0 ? new Date(rows[0]['timeout']) : '0';

                return axios.get(`https://graph.instagram.com/me/media?access_token=${token}&limit=${process.env.LIMIT || 9}&fields=media_type,media_url,timestamp,thumbnail_url,permalink`, {
                    method: `get`,
                    responseType: `json`
                }).then(igRes => {
                    const data = igRes.data.data

                    if (data !== null) {
                        response.statusCode = 200;
                        response.body = JSON.stringify({
                            data: data
                        });
                    } else {
                        console.error('Something bad happens');
                        response.statusCode = 500;
                        response.body = JSON.stringify({
                            data: 'Something bad happens'
                        });
                    }

                    // Check if we shall update the access token in the database. We only allowed to update the access token if
                    // the access token is not younger than 24 hours and not older than defined timeout
                    if (tstamp === null || (tstamp.getTime() + (24 * 60 * 60 * 1000) < Date.now() && Date.now < tstamp.getTime() + parseInt(timeout, 10) * 1000)) {
                        axios.get(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`, {
                            method: `get`,
                            responseType: `json`
                        }).then(refreshResponse => {
                            // TODO check if refreshResponse is properly formatted, else cancel the operation in this part and print error to console
                            console.log(`Got refresh token ${refreshResponse.data['access_token']}`);
                            const encryptedNewToken = CryptoJS.AES.encrypt(refreshResponse.data['access_token'], process.env.PASSKEY);
                            try {
                                conn.query(`INSERT INTO ${tableName} (access_tokens, timeout)
                                            VALUES (?, ?)`,
                                    [encryptedNewToken.toString(), refreshResponse.data['expires_in']])
                                    .then(res => {
                                        // TODO give output if the write operation is successful, else print error in console
                                    })

                                conn.destroy();
                            } catch (e) {
                                console.error('Got error when refreshing data in database with message: ', e);
                            }
                        }).catch(err => console.error(`Unable to get refresh access token! Error: ${err.toString()}`));
                    } else {
                        conn.destroy();
                        console.warn(`Access token is not updated as the timestamp is not in the legal value (${tstamp.toLocaleString('de-DE')})`);
                    }

                    return data;
                }).catch(err => this.constructResponse(response, 500, `Unable to get data from the API with message: ${err.toString()}`));

            }).catch(err => this.constructResponse(response, 500, `Unable to get data from the database for getting token with message: ${err.toString()}`));

    }).catch(err => this.constructResponse(response, 500, `Cannot make connection with database server with message: ${err.toString()}`));

    return response;
}