import $ from "jquery";
import MarkdownIt from "markdown-it";
import mdiFootNote_ from 'markdown-it-footnote';
import mdiAbbr_ from 'markdown-it-abbr';
import HtmlSanitizer from "./lib/htmlSanitizer";
import diff from "./lib/changeDiff";

export const mdiFootNote = mdiFootNote_;
export const mdiAbbr = mdiAbbr_;

const rgMdEditor = function () {
  this.id = null;
  this.height = "500px";
  this.previewEnabled = false;
  this.init = function (id) {
    if (this.id) {
      console.error("This MdEditor has already been initialized.");
      return false;
    }
    this.id = id;
    let self = this;
    let editor_body = this.id + " .rg_mde_body";
    let preview_parent = id + " .markdown-data";
    let code = id + " .rg_mde_code";
    let html_data =
      "PGRpdiBjbGFzcz0icmdfbWRlX3dyYXAiPgogIDxkaXYgY2xhc3M9InJnX21kZV90b29sYmFyIj4KICAgIDx1bD4KICAgICAgPCEtLTxsaT48YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9InJnX21kZV90Yl9ib2xkIj48Yj5CPC9iPjwvYnV0dG9uPjwvbGk+CiAgICAgIDxsaT48YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9InJnX21kZV90Yl9pdGFsaWMiPjxpPmk8L2k+PC9idXR0b24+PC9saT4KICAgICAgPGxpPjxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0icmdfbWRlX3RiX2xpbmsiPjx1Pmxpbms8L3U+PC9idXR0b24+PC9saT4KICAgICAgPGxpPjxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0icmdfbWRlX3RiX2ltYWdlIj5pbWFnZTwvYnV0dG9uPjwvbGk+LS0+CiAgICAgIDxsaT48YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9InJnX21kZV90Yl9wcmV2aWV3Ij5QcmV2aWV3PC9idXR0b24+PC9saT4KICAgIDwvdWw+CiAgPC9kaXY+CiAgPGRpdiBjbGFzcz0icmdfbWRlX2JvZHkiPgogICAgPGRpdiBjbGFzcz0ibWFya2Rvd24tY29kZSI+CiAgICAgIDx0ZXh0YXJlYSBjbGFzcz0icmdfbWRlX2NvZGUiPjwvdGV4dGFyZWE+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9Im1hcmtkb3duLWRhdGEiPgogICAgICA8cCBjbGFzcz0icHJldmlldy1tb2RlLXRpdGxlIj5QcmV2aWV3IE1vZGU8L3A+CiAgICAgIDxkaXYgY2xhc3M9InJnX21kZV9wcmV2aWV3Ij48L2Rpdj4KICAgIDwvZGl2PgogIDwvZGl2Pgo8L2Rpdj4=";
    let tpl = window.atob(html_data);
    $(id).html(tpl);
    $(preview_parent).hide();

    let el_bold = id + " .rg_mde_tb_bold";
    let el_italic = id + " .rg_mde_tb_italic";
    let el_link = id + " .rg_mde_tb_link";
    let el_image = id + " .rg_mde_tb_image";
    let el_preview = id + " .rg_mde_tb_preview";

    let input_forms = {
      bold: "**{$1}**",
      italic: "*{$1}*",
      link: "[text]({$1})",
      image: "![alt]({$1})",
    };

    let input_buttons = [el_bold, el_italic, el_link, el_image];

    $(function () {
      $(input_buttons.join(", ")).click(function () {
        let my_class = $(this).attr("class");
        my_class = my_class.replace("rg_mde_tb_", "");
        let replaced = input_forms[my_class];

        let selected_txt = self.getSelectedTxt(code);

        if (!selected_txt) {
          if (my_class == "link" || my_class == "image") {
            selected_txt = "https://example.com/example.jpg";
          } else {
            selected_txt = "text";
          }
        }

        let output = replaced.replace("{$1}", selected_txt);
        self.insertAtCursor(code, output);
      });

      $(el_preview).click(function () {
        let d = $(preview_parent).css("display");
        if (d == "none") {
          $(preview_parent).show();
          $(editor_body).css("height", "auto");

          self.renderMarkdownData();
          self.previewEnabled = true;
        } else if (d == "block") {
          $(preview_parent).hide();
          let height = self.getHeight();
          $(editor_body).css("height", height);
          self.previewEnabled = false;
        }
      });

      $(code).bind("keyup mouseup", function () {
        if (self.previewEnabled) self.renderMarkdownData();
      });

      $(code).on("keydown", function () {
        if (event.keyCode === 9) {
          let v = this.value,
            s = this.selectionStart,
            e = this.selectionEnd;
          this.value = v.substring(0, s) + "\t" + v.substring(e);
          this.selectionStart = this.selectionEnd = s + 1;
          return false;
        }
      });
    });
  };
  
  this.selectInitializedEditor = function (id) {
    if ($(id).find(".rg_mde_wrap")) {
      this.id = id;
    } else {
      console.error("MdEditor has not been initialized.");
    }
  };

  this.encodeReplacer = function (match, p1, p2, p3, p4, offset, string) {
    // replaces '<' into '< ' not to make this into html tags.
    return encodeURI(match.replace("<", "< ")); 
  }

  this.decodeReplacer = function (match, p1, p2, p3, p4, offset, string) {
    return decodeURI(match);
  }

  // render current markdown text to preview window as html format
  this.renderMarkdownData = function () {
    let preview = this.id + " .rg_mde_preview";
    
    let md = MarkdownIt({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true,
    }).use(mdiFootNote).use(mdiAbbr);

    let unescapedMarkdownText = this.getMarkdownText();

    // encodes LaTex text into URI
    // \$는 따로 escape 해 준다.($ 문자를 표현하기 위한 고육지책)
    unescapedMarkdownText = unescapedMarkdownText.replace("\\\$", '#36#X21kZV90b29sYmFyIj4');
    var latexReg1 = /(\$\$)[\w\W]+?(\$\$)|(\\\[)[\w\W]+?(\\\])|(\\\()[\w\W]+?(\\\))|\$[\w\W]+?\$/gm;
    let escapedMarkdownText = unescapedMarkdownText.replace(latexReg1, this.encodeReplacer);

    let result = HtmlSanitizer.SanitizeHtml(md.render(escapedMarkdownText));
    
    /*for testing *
    var t = document.createElement("textarea");
    document.body.appendChild(t);
    t.value = result;
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);*/
    
    // decode LaTex text from URI
    var latexReg2 = /(\$\$)[\w\W]+?(\$\$)|(\%5C\%5B)[\w\W]+?(\%5C\%5D)|(\%5C\x28)[\w\W]+?(\%5C\x29)|(([^\\]\$)|(^\$))[\w\W]*?([^\\]\$)/gm;
    let escapedLatexHtml = result;
    let unescapedLatexHtml = escapedLatexHtml.replace(latexReg2, this.decodeReplacer);
    unescapedLatexHtml = unescapedLatexHtml.replace('#36#X21kZV90b29sYmFyIj4', "\\\$");

    diff.changeDiff(diff.stringToHTML(unescapedLatexHtml), document.querySelector(preview));

    //let result = HtmlSanitizer.SanitizeHtml(md.render(this.getMarkdownText()));
    //diff.changeDiff(diff.stringToHTML(result), document.querySelector(preview));
  };

  this.addPreviewClass = function (classname) {
    let preview = this.id + " .rg_mde_preview";
    $(preview).addClass(classname);
  };

  this.getHtmlText = function () {
    let html = this.id + " .rg_mde_preview";
    return $(html).html();
  };

  // get whole markdown text from the simple editor
  this.getMarkdownText = function () {
    let code = this.id + " .rg_mde_code";
    return $(code).val();
  };

  // put markdown text into the simple editor at cursor position
  this.putText = function (data) {
    let code = this.id + " .rg_mde_code";
    this.insertAtCursor(code, data);
  };

  this.getSelectedTxt = function (el) {
    let txtarea = document.querySelector(el);
    let start = txtarea.selectionStart;
    let finish = txtarea.selectionEnd;
    let sel = txtarea.value.substring(start, finish);

    return sel;
  };

  this.setHeight = function (height) {
    let body = this.id + " .rg_mde_body";
    let code = this.id + " .rg_mde_body .markdown-code";

    this.editorHeight = height;

    $(body).css("height", height);
    $(code).css("height", height);
  };

  this.getHeight = function () {
    return this.editorHeight;
  };

  // insert text(myValue) into simple editor at cursor position
  this.insertAtCursor = function (el, myValue) {
    let myField = document.querySelector(el);
    myField.focus();
    let startPos = myField.selectionStart;
    let endPos = myField.selectionEnd;
    let preText = myField.value;
    myField.value =
      preText.substring(0, startPos) +
      myValue +
      preText.substring(endPos, preText.length);
     
    // move cursor to end of pasted text
    let cursorpos = startPos + myValue.length;
    myField.setSelectionRange(cursorpos, cursorpos);

    if (self.previewEnabled) self.renderMarkdownData();
  };

  this.changeContent = function (data) {
    let code = this.id + " .rg_mde_code";
    $(code).val(data);
    if (self.previewEnabled) self.renderMarkdownData();
  };
};

export default rgMdEditor;
