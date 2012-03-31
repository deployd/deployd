<div id="index">
  <div class="hero-unit">
    <h1>Deployd</h1>
    <p>A modern web server for front-end developers.</p>
  </div>
</div>

Basics
------

Deployd is a web server built on resources, in the style of REST. In the dashboard, you can build your app by creating resources and configuring them to work the way the want.


Routing
-------

When Deployd receives an HTTP request, it checks the first part of the URL to see which resource should handle the request:

  * **/todos**/12345 - handled by the **/todos** resource
  * **/admin**/users/12345 - handled by the **/admin** resource, if it exists (you cannot create multi-part resource names)
  * **/img**/bg.jpg - handled by the **/img** resource
  * **/**index.html - handled by the **/** resource


Reserved resource names
-----------------------

Certain resource paths are used internally by Deployd. You should not create resources with these names:

  * /keys
  * /types
  * /resources
  * /sessions
  * /property-types
  * /__dashboard

REST
----

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

Cross-Origin AJAX
-----------------

Deployd is configured so that you can easily develop a web app locally on your computer. It will send Access-Control-Allow-Origin HTTP headers if a request is coming from localhost or your filesystem, which will allow modern web browsers to use AJAX normally. It will not send these headers for any other domain.