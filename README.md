BidHub Web Administration
===================
Small web app to see the current status, item winners, and some neat stats for a BidHub auction. BidHub is HubSpot's open-source silent auction app - for an overview of the project, [check out their blog post about it](http://dev.hubspot.com/blog/building-an-auction-app-in-a-weekend)!

This will be entirely useless to you if you haven't set up Kinvey and followed the instructions in the [BidHub Cloud Code repository](https://github.com/ncauldwell/BidHub-CloudCode).

![Screenshot](http://i.imgur.com/0hPpRLBl.png)

## Setup
Assuming you've already set up Kinvey, you'll need to get your application key from the Kinvey console and you'll also need to create a new Role and a new User.

## Admin Role and User
### Admin Role
1. In the Kinvey Console for your app, go to Identity > Roles and [[+ Add a Role]].
2. Give it a name and description and click Save.
3. Now go to Identity > Users and click the Settings gear icon.
4. Under Permissions, click [[+Add role access]] and choose the new role you just created. Be sure to grant that role **Always** permissions for each CRUD (Create, Read, Update, Delete) action set. Save.

### Admin User
1. In the Kinvey Console for your app, go to Identity > Users and [[+ Add User]].
2. Enter the username and password for your administrator user and [[Save]].
3. Click the checkbox on the new user's row and in the Roles section choose the admin role you created earlier and click [[Assign Role]].

## Finish Up
`git clone` this repository and edit *controllers.js*, *index.html*, and *items.html* replacing `<your kinvey app key>`, `<your auction admin username>`, and `<your auction admin password>` with the appropriate values.

Open index.html in Chrome and you're good to go! Put this on any web server for easy access, but not really. These files have the plain text username and password of a user with complete control of the users collection. This should not just be "put on any web server". 

## Page Listing
* `index.html` shows basic auction and item stats; it also has a form for adding new items to the auction, though I'm not certain that form works - I moved that function to a separate page.
* `items.html` shows all the auction items and allows you to add new items.
* `users.html` lists all registered users and allows you to assign them a bidder number (or remove their bidder number).
* `winning.html` lists all items in the auction with the current high bid & bidder.
