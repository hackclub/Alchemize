# Getting Started with Unreal Engine
 
## **Installation**
 
Download the Epic Games Launcher from [unrealengine.com](https://www.unrealengine.com) and create a free Epic Games account. Once inside the launcher, go to the Unreal Engine tab, click Library, and click the + button to add the latest UE5 version. The download is roughly 25–35 GB.
 
## **Creating Your First Project**
 
1. Open the Epic Games Launcher and click **Launch**.
2. The Unreal Project Browser will open. Click on create project on the left.
3. The Unreal Project Browser will open. Choose a template (Blank, Third Person, First Person, etc).

![Project Defaults settings](Images/ProjectTemplates.png)

3. Set your project to **Blueprint** (easier for beginners) or **C++**.
4. Choose a project name and folder.

![Project Defaults](Images/ProjectDefaults.png)

5. Click **Create**.

## **Getting started to getting started**

Upon opening up your editor you will be greeted with something like this

![NewProject](Images/NewProject.png)

This is the open world map, this is simply too complex to work with, so to get started go to

**File** ----> **Create new level**

![Create new level](Images/NewLevel.png)

Then click on basic and create

![alt text](Images/CreateNewLevel.png)

Then click on save or simply **CTRL + S**, save it in contents

![Save Map](Images/SaveMap.png)

Then go to **edit** ---> **Project Settings** -------> **Maps and modes**

![Maps and modes](Images/MapsAndModes.png)

Click on both **Editor Startup Map** and **Game Default Startup Map** and select your saved level

![Selecting New Map](Images/SettingNewMap.png)

What this essentially does is whenever you open your project again, it will always open up in this level as opposed to the default open world level. This is where we will learn the basics of Unreal Engine


## **The Editor Interface**
 
### **Viewport**

The 3D scene view. This is where you preview most of your stuff and build your level. To navigate around your 3D viewport, you can hold **Right Mouse Button** and move around using WASD using your mouse to look around. Alternately you can hold down the **Left Mouse Button** and move your mouse to move around but that is less accurate

![Moving Around Viewport](Gifs/MovingAround.gif)

You can add either **basic objects** or from the **content drawer**(discuss later) and interact with them. 
When you click on an object, you can move it around, rotate it or scale it. These modes can be changed using **W, E, R** keys on the keyboard. 

- W key allows you to move an object
- E Key allows you to rotate them
- R key allows you to scale them

![Moving, Rotating and Scaling](Gifs/AddingCube.gif)

(Recording did not capture it but I went to **Get Content** --> **Shapes** --> **Cube**)

You can also duplicate objects by either using **CTRL+C** and **CTRL+V**
or you can **hold ALT while moving an object** to duplicate

![Moving, Rotating and Scaling](Gifs/DetailsPanel.gif)

All level design is done in the viewport, it depends on how you wanna make your game.


### **Outliner**

The outliner is this tab over here, it lists all the characters in your current level
![Outliner](Images/Outliner.png)

It allows you to select your objects and view them in the details panel

### Note: My UE5 Layout might differ from yours, you can simply move windows around you by clicking on their tabs
![WindowDocking](Gifs/WindowDocking.gif)

### **Details Panel**

The details panel is an important window, 
It is where we can view and change the properties of an object like size, location, rotation
Shape, texture and any other properties we may link

![DetailsPanel](Gifs/DetailsPanel.gif)




### **Content Browser**

Everything we create or use in our project goes to content browser, everything from textures, to models to blueprints all sits there.

It is located on the bottom left

![ContentBrowserButton'](Images/ContentBrowser.png)

![ContentBrowser](Images/NewMapContentDrawer.png)

You can create new items by **right clicking** and choosing whatever you wanna make.
It is often recommended to **clean up your content drawer** so its easy to move around content drawers. 

![ContentBrowser](Gifs/ContentDrawer.gif)

You can also view and check out engine content but it is generally recommended not to mess around with it without a good knowledge of how the engine works

you can do so by clicking the **gear icon** on the top right of the content drawer and check **engine content**.

![EngineContentEnable](Images/EngineContent.png)

you can go uncheck it if you don't wanna see it in your content drawer. 

### **Play in editor**

To play your game in editor you click the **green icon** at the top or press **Alt + P**

![PlayIcon](Images/PlayButton.png)

While playing to break out you can press **Shift + F1** to break your cursor in editor
Since we dont have a character, we possess a default pawn 

To break out of the play through and view your level we can click the detach icon
it allows us to view our own character and the level. 

![Detach](Images/DetachButton.png)

You can also simulate the level by using the simulate button

![SimulateButton](Images/SimulateLevel.png)

(This gif below shows the entire playthrough session and how it works)

![SimulateButton](Gifs/PlayTest.gif)

And once you are done playing just press **esc** on your keyboard to stop the session.


## **BluePrints**

In unreal engine there are mainly 2 types of Blueprints you work with, Level Blueprint and Blueprint Class

### **Level Blueprint**

**Level blueprint** is assigned to specific levels in a project. It controls the elements specific to that exact level.
So lets say for eg. you have multiple different levels, so you can control how each level would play out etc.

To open level blueprint you open the Blueprint Class Dropdown given in the photo,
then click on Level Blueprint

![BlueprintIcon](Images/BlueprintClassDropdown.png)

### **A little extra setting**

if your window opens like this and you want it to open in the main window like your project settings

![BadWindow](Images/BadLayout.png)

you can simply go to **Edit** --> **Editor Preferences** --> Search for **Asset Editor Location** and set it to **main window**

![Set Asset editor to main window](Images/EditorPreferences.png)

Now your window will open in a new window :D

so now your level blue print looks something like this

![LevelBlueprint](Images/LevelBlueprint.png)

You can zoom in and out using your **scroll wheel**
you can also move around by holding the **Right Mouse Button**.

Lets go over what each element is to understand it better

- **Event BeginPlay**: It is an event that fires everytime we begin play. It can be used in places like storing values for variables and stuff etc.

- **Event Tick**: It is an event that fires every tick or a set time between frames. This is used for repeatedly doing something every frame. You can get the time between frames by using **Delta Seconds**

- **Functions**: As the name suggests, they perform some instructions we give them. They may take input or give outputs. There are 2 types of functions, **pure** and **non-pure**. Pure functions are those which do not require execution pin (will discuss later) and non-pure require execution pins. Unreal has a bunch of inbuilt functions but we can create our own as well.

![Functions](Images/Function.png)

- **Variables**: They are used to store items, they are in various data types like **int**, **bool**, **float**, **string** etc. and they can be of different types like **singe**, **array**, **set**, **map** etc. We can tweak their properties in the details panel

![Variables](Images/VariableDetails.png)

There are a seperate type of variables called **Local Variables**, these exist only inside of functions and cannot be accessed outside.

That is all the basics of Level Blueprint, lets create a basic level blueprint to print a string.

First we need to drag off the **execution pin** on event begin play (Execution pin the small triangle at the end BeginPlay)
An execution pin is basically a pin that directs each event to fire. Its like a wire, when the we begin play, the wire is activated and all nodes connected to it also fire.

![BeginPlayExecutionPin](Images/ExecutionPin.png)

After we drag of beginplay we can search for **Print String**, after selecting that we can hit enter
And then expand the drop down.

![BeginPlayExecutionPin](Gifs/PrintString.gif)

Here we can see a bunch of settings, for now we will only focus on these ones:
- **In String**: This contains the thing you wanna print, for now I will leave that at Hello
- **Print to Screen**: Make sures that we want to print this to our screen or not
- **Text Colour**: Colour of the text we print
- **Duration**: How long we want it to stay on the screen (In seconds)

![PrintSettings](Images/PrintStringSettings.png)

These are my settings, you can copy them if you want or tweak and have fun yourself
After that lets hit play
And as you can see on the top left we have our message

![PlayMessage](Images/EventBeginPrintString.png)

Now we can also add a **delay node**, so we can stop our game by using **esc**.
Go back to level blueprint

We can detatch nodes by 2 ways,

1) We can hold **ALT** and **left mouse click** on the execution pin

![RemovePin](Gifs/RemovePin.gif)

2) Or we can hold **CTRL** and **click and drag** it around and **release** it on the pin we want to add it on

![RemovePin](Gifs/ChangeExecPin.gif)

Do whatever feels best to you and add the delay nodes the same way we added our print node and join it to our print string
It should look like this

![DelayNodeAddedPrint](Images/DelayPrint.png)

If you press play again, you will see the print string after the duration you set


Similarly if you hooked print string into **Event Tick**
you will see MULTIPLE print strings that spawn every frame

![PrintStringEventTick](Images/EventTickPrint.png)
![EventTickPrint](Images/TickPrint.png)

For this guide I will only go over level blueprints as Blueprint classes are a little more complex and we will build in a more structured guide


## **Some Extra Stuff**


### **Compiling Blueprints**:

You should compile your blueprint after doing something big to check if everything works, you can compile by clicking the compile button on the top left

![CompileButton](Images/CompileButton.png)

This ensures that no errors are present in case you create systems that are dependent on the current system.

### **Saving project**:

You can save the current object your editing by using **CTRL + S**

or you can save the entire project if there are any unsaved Changes using **CTRL + SHIFT + S**

### **Adding blueprints in between**

You can also add blueprints in between two blueprints by **right clicking** on the execution wire

![AddingBluePrintInBetween](Gifs/AddingBlueprintsToExec.gif)

## **Wrapping Up**

That is all for this guide for now
I just wanted to give you a little taste of Unreal Engine.

It is a very powerful engine where you can create games by using just its visual scripting.
If you wanna learn more you can check out our other guides on this where I go deeper into how this engine works by creating hands on projects

Or there are plenty resources online

Till then have a fantastic day

![Magic](Gifs/Magic.gif)