exports.handler = async (event, context) => {
    return await fetch(`https://graph.instagram.com/me/media?access_token=${process.env.ACCESS_TOKEN}&limit=${process.env.LIMIT ? process.env.LIMIT : 9}&fields=media_type,media_url,timestamp,thumbnail_url`,
        {
            method: `GET`,
            mode: `cors`,
            cache: `default`,
        }).then(response => response.json())
        .catch(error => console.error(error));
}