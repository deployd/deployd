<% title("Deploying Your App") %>

# Deploying Your App

When you want to share your app with the world, you can use Deployd's beta hosting service to host it online in seconds.

*Note: this service is heavily in development and will change drastically in the future*

In your Deployd app folder, type the command:
  
    dpd deploy [subdomain]

If you do not provide a subdomain, it will automatically use the app's folder name.

*Note: if you recieve a "not allowed" error, it means that the subdomain you requested is in use by another app and you don't have the credentials to push to it. In that case, you choose another subdomain.*

When it is done, you can access your app at `[subdomain].deploydapp.com`. 

# Accessing Your App's Dashboard

To access your app's dashboard (for example, to add data), you can go to `[subdomain].deploydapp.com/dashboard` or type `dpd remote`. The Dashboard will prompt you for a key, type `dpd showkey` to print this key to the console and paste it into the box.

# Working with collaborators

To provide additional collaborators access to push new versions and access the dashboard, you can copy the `deployments.json` and `keys.json` files out of your app's `.dpd` directory and give them to your collaborators. Your collaborators can then paste these files in their own `.dpd` directory and use the `deploy`, `remote`, and `showkey` commands.