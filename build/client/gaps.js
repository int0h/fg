var gapClassMgr = require('fg-js/client/gapClass.js');
gapClassMgr.regGap({
    "name": "content",
    "path": "../gaps/content",
    "render": require("../gaps/content/render.js"),
    "update": require("../gaps/content/update.js"),
});
gapClassMgr.regGap({
    "name": "data",
    "path": "../gaps/data",
    "render": require("../gaps/data/render.js"),
    "update": require("../gaps/data/update.js"),
});
gapClassMgr.regGap({
    "name": "dynamic-text",
    "path": "../gaps/dynamic-text",
    "render": require("../gaps/dynamic-text/render.js"),
    "update": require("../gaps/dynamic-text/update.js"),
});
gapClassMgr.regGap({
    "name": "fg",
    "path": "../gaps/fg",
    "render": require("../gaps/fg/render.js"),
    "update": require("../gaps/fg/update.js"),
});
gapClassMgr.regGap({
    "name": "raw",
    "path": "../gaps/raw",
    "render": require("../gaps/raw/render.js"),
    "update": require("../gaps/raw/update.js"),
});
gapClassMgr.regGap({
    "name": "scope",
    "path": "../gaps/scope",
    "render": require("../gaps/scope/render.js"),
    "update": require("../gaps/scope/update.js"),
});
gapClassMgr.regGap({
    "name": "scope-item",
    "path": "../gaps/scope-item",
    "render": require("../gaps/scope-item/render.js"),
    "update": require("../gaps/scope-item/update.js"),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2Fwcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jbGllbnQvZ2Fwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUN0RCxXQUFXLENBQUMsTUFBTSxDQUFDO0lBQ2xCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLE1BQU0sRUFBRSxpQkFBaUI7SUFDekIsUUFBUSxFQUFFLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQztJQUM5QyxRQUFRLEVBQUUsT0FBTyxDQUFDLDJCQUEyQixDQUFDO0NBQzlDLENBQUMsQ0FBQztBQUNILFdBQVcsQ0FBQyxNQUFNLENBQUM7SUFDbEIsTUFBTSxFQUFFLE1BQU07SUFDZCxNQUFNLEVBQUUsY0FBYztJQUN0QixRQUFRLEVBQUUsT0FBTyxDQUFDLHdCQUF3QixDQUFDO0lBQzNDLFFBQVEsRUFBRSxPQUFPLENBQUMsd0JBQXdCLENBQUM7Q0FDM0MsQ0FBQyxDQUFDO0FBQ0gsV0FBVyxDQUFDLE1BQU0sQ0FBQztJQUNsQixNQUFNLEVBQUUsY0FBYztJQUN0QixNQUFNLEVBQUUsc0JBQXNCO0lBQzlCLFFBQVEsRUFBRSxPQUFPLENBQUMsZ0NBQWdDLENBQUM7SUFDbkQsUUFBUSxFQUFFLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQztDQUNuRCxDQUFDLENBQUM7QUFDSCxXQUFXLENBQUMsTUFBTSxDQUFDO0lBQ2xCLE1BQU0sRUFBRSxJQUFJO0lBQ1osTUFBTSxFQUFFLFlBQVk7SUFDcEIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztJQUN6QyxRQUFRLEVBQUUsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0NBQ3pDLENBQUMsQ0FBQztBQUNILFdBQVcsQ0FBQyxNQUFNLENBQUM7SUFDbEIsTUFBTSxFQUFFLEtBQUs7SUFDYixNQUFNLEVBQUUsYUFBYTtJQUNyQixRQUFRLEVBQUUsT0FBTyxDQUFDLHVCQUF1QixDQUFDO0lBQzFDLFFBQVEsRUFBRSxPQUFPLENBQUMsdUJBQXVCLENBQUM7Q0FDMUMsQ0FBQyxDQUFDO0FBQ0gsV0FBVyxDQUFDLE1BQU0sQ0FBQztJQUNsQixNQUFNLEVBQUUsT0FBTztJQUNmLE1BQU0sRUFBRSxlQUFlO0lBQ3ZCLFFBQVEsRUFBRSxPQUFPLENBQUMseUJBQXlCLENBQUM7SUFDNUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQztDQUM1QyxDQUFDLENBQUM7QUFDSCxXQUFXLENBQUMsTUFBTSxDQUFDO0lBQ2xCLE1BQU0sRUFBRSxZQUFZO0lBQ3BCLE1BQU0sRUFBRSxvQkFBb0I7SUFDNUIsUUFBUSxFQUFFLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQztJQUNqRCxRQUFRLEVBQUUsT0FBTyxDQUFDLDhCQUE4QixDQUFDO0NBQ2pELENBQUMsQ0FBQyJ9