angular.module('videoconference')
  .directive("styledCheckbox", function () {
    return {
      restrict: "E",
      replace: true,
      templateUrl: "styled-checkbox.html",
      transclude: true,
      scope: {
        model: "=model",
        checkedText: "@checkedText",
        checkedIcon: "@checkedIcon",
        uncheckedText: "@?uncheckedText",
        uncheckedIcon: "@?uncheckedIcon",
        display: "@?display",
        reversed: "@?reversed",
        isDisabled: "@?isdisabled",
        change: "&change"
      },
      link: function (e) {
        e.id = "checkbox-" + e.$id
      }
    }
  })
  .directive("clickAutoselect", function () {
    return {
      restrict: "A",
      link: function (e, element) {
        element.bind("click", function () {
          this.focus();
          this.select();
        });
      }
    }
  })
  .directive("dancingDots", function () {
    return function (e, element) {
      (function () {
        var e = 0;
        window.setInterval(function () {
          for (var t = "", o = 0; e > o; o++) t += ".";
          element.text(t), 3 !== e ? e += 1 : e = 0;
        }, 1000)
      })()
    };
  })
