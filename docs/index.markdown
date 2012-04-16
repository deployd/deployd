# Deployd

***Deployd** lets you quickly build secure, dynamic JavaScript and Mobile apps without writing backend code. Instead you boot a simple server that is very good at securely proxying requests to a storage layer such as a database. This enables your un-trusted client code to do things it never could before, such as write directly to a database without a custom application running in-between.*

Instead of reinventing a protocol, deployd embraces HTTP. This means that any HTTP client, such as a JavaScript app, a mobile app, or even another server, can securely interact with your data without having to setup a web server and write a custom backend.

## Quick start

To install deployd locally you must have `npm` and a running instance of mongodb.

    [sudo] npm install deployd -g
    
First you'll want to generate an authentication key.

    dpd key
    
Copy the key for use in the dashboard. Then start the server.

    dpd listen

You can view the dashboard at `http://localhost:2403/__dashboard/`. It will prompt you for your auth key.

## How does it work?

### Resources

When deployd receives an HTTP request, it checks the first part of the URL to see which resource should handle the request:

  * **/todos**/12345 - handled by the **/todos** resource
  * **/img**/bg.jpg - handled by the **/img** resource
  * **/**index.html - handled by the **/** resource

Once deployd knows what resource is being requested, it will validate the input, execute any event handlers you have defined and either return or store the result. You can create and configure resources and event handlers in the dashboard.

## REST API

REST is a web service design pattern that conforms closely to HTTP itself. In Deployd, HTTP methods or verbs have meaning:
  
  * **GET** - Load a resource without modifying it (this is a browser's default method)
  * **POST** - Create a resource, or send data to a special that doesn't fit within these methods
  * **PUT** - Update an existing resource
  * **DELETE** - Destroy an existing resource

In Deployd, HTTP response codes are also important:

  * **200** OK - The request succeeded
  * **204** No Content - The request succeeded, but there is no content to return (for example, after a deletion, or requesting an empty list)
  * **400** Bad Request - The request did not pass validation. Change the parameters and try again.
  * **401** Unauthorized - The request's session does not have permission to access that resource. 
  * **404** Not Found - That URL does not reference an existing resource
  * **500** Internal Server Error - Deployd has failed to process the request due to an unexpected error.

## Cross-Origin AJAX

Deployd is configured so that you can easily develop a web app locally on your computer. It will send Access-Control-Allow-Origin HTTP headers if a request is coming from localhost or your filesystem, which will allow modern web browsers to use AJAX normally. It will not send these headers for any other domain.

<hr />