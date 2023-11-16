# Acode Workspace Manager

Simple Acode plugin to manage your workspace.

## What It Does
The plugin allows you to save the list of open files, open folders, app settings
into a file.
And gives you the ability to load that file into your current session.

It adds a `sidebarApp` for loading and saving workspace.

### What's New

- Recent Spaces list for faster saving and loading.
- Loading animation.
- File mode specific settings

```json
* settings.json

{
  ...
  "fontSize": "10px",
  "tabSize": 2,
  "formatter": "prettier",

  "[python]": {
    "fontSize": "12px",
    "tabSize": 4,
    "formatter": "mypy"
  },
  "[javascript]": {
    "formatter": "beautify"
  }
  ...
}
```

### How to Save

> After saving a workspace any future changes would not be saved (You have to
resave the file)

<ul>
<li>Open sidebar</li>
<li>Click on the `Save Workspace` button</li>
<li>Create / Select the file to save the workspace in (preferably
`{filename}.workspace.json`)</li>
</ul>

### How to load
<ul>
<li>Open sidebar</li>
<li>Click on the `Load Workspace` button</li>
<li>Select the workspace file to load.</li>
</ul>

## To Do
<ul>
<li>Add support for plugins using acode sdk</li>
</ul>