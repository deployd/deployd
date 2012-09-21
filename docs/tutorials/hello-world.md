# Hello World

In this tutorial, you'll get a taste of how to use Deployd by creating a simple backend.

## Creating an app

Start out by creating a Deployd app. Open a command line in a directory of your choice and type:

	$ dpd create hello -d

This will create your first Deployd app in a folder called `hello` and open up the Deployd *Dashboard*. If you open up the folder and look at the contents, you'll see the following files and folders:

 - `.dpd` is an internal folder that contains housekeeping information.
 - `data` contains your app's database.
 - `public` contains all of the static web assets that you'd like to host.
 - `resources` contains your application's resource configuration.
 - `app.dpd` is your app's settings.

## Dashboard

The Dashboard is where you will create the *resources* that make up your app's backend. A resource is essentially a feature that your frontend needs to access. 

This new app doesn't contain any resources yet, so add one now by clicking on "Resources +" and choosing Collection. Click "Create" (leave it at its default name of `my-objects`). 

![Dashboard](http://deployd.com/img/tutorials/hello-world-dashboard.png)

You have just added your first resource to Deployd!

## Collections

The dashboard should open up the Collection Property editor.

![Properties](http://deployd.com/img/tutorials/hello-world-properties.png)

This is where you define the objects that you want to store in this Collection. For now, make sure `string` is selected as the type and enter `name` as the property. Click "Add". This means that every object stored in the `my-objects` collection will have a `name` property.

Click on "Data" in the sidebar. This will open up the Collection Data editor. Type "World" in the `name` field and click "Add". Now the `my-objects` collection has an object in it.

Let's see how this will look to your app's frontend code. Open up a new browser tab and navigate to `http://localhost:2403/my-objects`. (If your browser tries to download it as a file, open it with any text editor.) You should see something like this (your "id" will be different):

	[
		{
			"name":"World",
			"id":"a59551a90be9abd8"
		}
	]

This is a JSON array of objects. If you add another object to the collection, it will look like this:

	[
		{
			"name":"World",
			"id":"a59551a90be9abd8"
		}, {
			"name":"Joe",
			"id":"d0be45d1445d3809"
		}
	]

If you copy one of the ids and put it at the end of the URL (i.e. `/my-objects/a59551a90be9abd8`), you will see just that object:

	{
		"name":"World",
		"id":"a59551a90be9abd8"
	}

Collections allow you to access data on the backend with very little setup.

## Events

Go back to the Dashboard and click on the "Events" link in the sidebar. Select the "On Get" tab and type the following JavaScript:

	this.greeting = "Hello, " + this.name + "!";

If you check the data again, you will see that value set on the objects:

	[
		{
			"name":"World","id":"a59551a90be9abd8",
			"greeting":"Hello, World!"
		}, {
			"name":"Joe",
			"id":"d0be45d1445d3809",
			"greeting":"Hello, Joe!"
		}
	]

Events allow you to customize the behavior of data in a collection with simple JavaScript.

## Next Steps

This was just a quick tour through Deployd. To learn more:

- If you have an application that can send raw HTTP requests, you could try to save data using POST and PUT verbs. Make sure to add a `Content-Type: application/json` header.
- Check out the API link on the sidebar and see how to access this data from your frontend JavaScript. Try building a simple app in the `public` folder.
- Check out [the community](/community.html) and ask questions about Deployd.
- Start reading the [Comments App](/docs/tutorials/comments-1.html) tutorial to see how to make a full app

<a class="btn btn-primary" href="http://deployd.com/downloads/tutorials/dpd-hello-world.zip"><i class="icon-white icon-download"></i> Download Source</a>