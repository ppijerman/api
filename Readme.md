# PPI Jerman API Repository

This is open-sourced API programming code that used by PPI Jerman for
organizational purpose. 

# Deployment

The API is deployed on Netlify. Currently, there are 2 deployment, 
`development` and `production`. 

The `development` has the domain `netlify-1-dev.ppijerman.org`
and deploy the branch `development`.

The `production` has the domain `netlify-1.ppijerman.org`
and deploy the branch `master`.

# APIs

## Get Posts

This API fetches the post from the Instagram Graph API. 
The HTML and (front-end) Javascript code example 
can be seen in `instagram-posts.html`.

The new API specification limit the usage of API by 
only using OAuth. This causes problem as we cannot fetch directly
all data without an access token. To overcome this, we
first call the Instagram API endpoint to get
the access token and then save them in a database for 
getting refresh token. 

This implementation require that the initial access token
is set in the Netlify environment variable. The code assumes
that the API is called ***at least*** once before the current
auth code expired. If the auth code is expired, then there will
be error in the code and initial auth code need to be 
set again (manually).

To prevent the auth code being expired, one can use free cron job
service in internet (e.g., [https://cron-job.org/](https://cron-job.org/)) 
that call the API endpoint every day to make sure that the auth 
code always refreshed every day.

The application that used for OAuth is maintained by current or previous 
committees of PPI Jerman. 

> ***Make sure at least one committee have access to the application
> via Instagram developer portal***

The database that used for storing auth codes are hosted by PPI Jerman.
The stored auth codes are ***always*** encrypted. The cipher that 
used to encrypt the auth codes could be asked to current or previous
committee, too. The encryption happens in ***API side*** using `CryptoJS`.

> ***Make sure at least one committee know the cipher or where it is
> located***