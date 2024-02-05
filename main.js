(function () {
  let plugin = {
    id: "acode.plugin.workspace",
  };

  let Url = acode.require("Url");
  let toast = acode.require("toast");
  let loader = acode.require("loader");
  let fs = acode.require("fsOperation");
  let helpers = acode.require("helpers");
  let openFolder = acode.require("openFolder");
  let fileBrowser = acode.require("fileBrowser");
  let sidebarApps = acode.require("sidebarApps");
  let appSettings = acode.require("settings");
  let EditorFile = acode.require("EditorFile");

  let style = tag("style", {
    textContent: `
      #spaceManager {
        width: 80%;
        height: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-around;
        padding: 10%;
      }
      
      #spaceManager button {
        width: 80%;
        height: 10%;
      }

      #spaces-list {
        height: 50%
      }
      
      #spaces-list .space-item {
        display: flex;
        justify-content: space-around;
        align-items: center;
      }
      
      #spaces-list .space-item .space-name {
        
      }
      
      .recent-spaces {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
      }
    `,
  });

  class WorkspacePlugin {
    init() {
      this.recentspaces = JSON.parse(
        localStorage.getItem("acw:recent") || "[]"
      );

      document.head.appendChild(style);
      sidebarApps.add("folder2", plugin.id, "Workspace Manager", (container) => {
        this.node = tag("div", {
          id: "spaceManager",
          children: [
            tag("button", {
              textContent: "Load Workspace",
              onclick: () => this.loadSpace(),
            }),
            tag("button", {
              textContent: "Save Workspace",
              onclick: () => this.saveSpace(),
            }),
          ],
        });
        this.spacesNode = tag("div", {
          id: "spaces-list",
          children: [],
        });
        container.append(
          this.node,
          tag("div", {
            className: "recent-spaces",
            children: [
              tag("h3", {
                className: "spaces-title",
                textContent: "Recent Spaces",
              }),
              this.spacesNode,
            ],
          })
        );
      });

      this.origSettings = appSettings.value;
      this.$func = this.loadModeSpace.bind(this);

      editorManager.on("switch-file", this.$func);
      // this.$func();

      this.buildSpaceList();
    }

    async saveSpace(spaceUrl) {
      const folders = helpers.parseJSON(localStorage.folders) || [];
      const files = helpers.parseJSON(localStorage.files) || [];
      const fileBrowserState =
        helpers.parseJSON(localStorage.fileBrowserState) || [];
      let storageList = helpers.parseJSON(localStorage.storageList) || [];

      let data = JSON.stringify({
        files,
        folders,
        storageList,
        fileBrowserState,
        settings: appSettings.value,
      });

      if (!spaceUrl) {
        let spaceFile = await fileBrowser(
          "file",
          "Select file to save workspace"
        );
        spaceUrl = spaceFile.url;
      }

      let loading = loader.create("Workspace", "Saving Workspace");
      loading.show();

      await fs(spaceUrl).writeFile(data, "utf-8");

      if (!this.recentspaces.includes(spaceUrl)) {
        this.recentspaces.push(spaceUrl);
      }
      localStorage.setItem("acw:recent", JSON.stringify(this.recentspaces));
      this.buildSpaceList();

      loading.destroy();
      toast("Saved workspace.");

    }

    async loadSpace(spaceUrl) {
      if (!spaceUrl) {
        let spaceFile = await fileBrowser("file", "Select workspace file");
        spaceUrl = spaceFile.url;
      }

      let loading = loader.create("Workspace", "Loading Workspace");
      loading.show();

      let data = await fs(spaceUrl).readFile("utf-8");
      // console.log(spaceFile.name);

      const { folders, files, storageList, fileBrowserState, settings } =
        helpers.parseJSON(data) || {};

      while (addedFolder.length) {
        addedFolder.forEach((folder) => openFolder.removeItem(folder.url));
      }

      loading.setMessage("Loading Files");

      editorManager.files.forEach((file) => file.remove());

      loading.setMessage("Loading Folders");

      folders.forEach((folder) => {
        folder.opts.listFiles = !!folder.opts.listFiles;
        openFolder(folder.url, folder.opts);
      });

      let rendered = false;

      try {
        await Promise.all(
          files.map(async (file, i) => {
            rendered = file.render;

            if (i === files.length - 1 && !rendered) {
              file.render = true;
            }

            const { filename, render = false } = file;
            const options = {
              ...file,
              render,
              emitUpdate: false,
            };
            new EditorFile(filename, options);
          })
        );
      } catch {}

      loading.setMessage("Saving Folders");
      localStorage.setItem("folders", JSON.stringify(folders));
      loading.setMessage("Saving Files");
      localStorage.setItem("files", JSON.stringify(files));
      localStorage.setItem("storageList", JSON.stringify(storageList));
      localStorage.setItem(
        "fileBrowserState",
        JSON.stringify(fileBrowserState)
      );

      loading.setMessage("Updating Settings");
      appSettings.update(settings, false, false);
      
      if (!this.recentspaces.includes(spaceUrl)) {
        this.recentspaces.push(spaceUrl);
      }
      localStorage.setItem("acw:recent", JSON.stringify(this.recentspaces));
      this.buildSpaceList();

      loading.destroy();
      toast("Loaded workspace.");
    }

    loadModeSpace() {
      let { session } = editorManager.editor;
      let mode = session.$modeId.replace("ace/mode/", "");
      let modeSettings = appSettings.value[`[${mode}]`];

      // console.log(mode, modeSettings)
      if (modeSettings) {
        if (!this.revertSetting) {
          this.revertSetting = this.revert(modeSettings, appSettings.value);
        }
        // console.log(this.revertSetting);
        appSettings.update(modeSettings, false, false);
      } else {
        this.revertSetting &&
          appSettings.update(this.revertSetting, false, false);
        this.revertSetting = null;
      }
    }

    revert(modeSettings, origSettings) {
      let data = {};
      for (let key in modeSettings) {
        data[key] = origSettings[key];
      }
      return data;
    }

    buildSpaceList() {
      this.spacesNode.innerHTML = "";

      for (let space of this.recentspaces) {
        let filename = Url.basename(space);
        let icon = helpers.getIconForFile(filename);

        this.spacesNode.append(
          tag("div", {
            className: "space-item",
            children: [
              tag("span", {
                className: icon,
              }),
              tag("div", {
                className: "space-name",
                children: [
                  tag("span", {
                    textContent: filename,
                  }),
                ],
                onclick: async () => {
                  let action = await acode.select("Select Action", [
                    ["load", "Load Space", "file_upload"],
                    ["save", "Save Space", "save"],
                    ["remove", "Remove Space", "edit"],
                    ["delete", "Delete Space", "delete"],
                  ]);
                  switch (action) {
                    case "load":
                      await this.loadSpace(space);
                      break;
                    case "delete":
                      if (!(await acode.confirm("Delete space?"))) {
                        return;
                      }
                      await fs(space).delete();
                      break;
                    case "save":
                      await this.saveSpace(space);
                    case "remove":
                      this.recentspaces = this.recentspaces.filter(
                        (s) => s !== space
                      );
                      localStorage.setItem(
                        "acw:recent",
                        JSON.stringify(this.recentspaces)
                      );
                      this.buildSpaceList()
                  }
                },
              }),
            ],
          })
        );
      }
    }

    destroy() {
      style.remove();
      sidebarApps.remove(plugin.id);

      editorManager.off("switch-file", this.$func);
    }
  }

  const acodePlugin = new WorkspacePlugin();

  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
      if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
      }
      acodePlugin.baseUrl = baseUrl;
      await acodePlugin.init($page, cacheFile, cacheFileUrl);
    }
  );

  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
})();
