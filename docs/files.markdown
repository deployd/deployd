# Files Resource

The Files Resource allows you host static files from your app, such as HTML, browser JavaScript, CSS, images, and videos.

The Files Resource is always included in your app.

## Accessing files

Send a GET request with the filename to load the raw file. This is how browsers request pages and files by default.

    GET /register.html

    GET /images/bg.jpg

## Home page

If the Files Resource receives a request without a filename, it will automatically redirect to "index.html" if available.