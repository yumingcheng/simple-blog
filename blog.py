#!/usr/bin/env python
#-*-coding:utf-8-*

import os.path
import re
import torndb
import tornado.auth
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.escape
import tornado.web
import unicodedata
import json
import time
from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)
define("mysql_host", default="127.0.0.1:3306", help="maoYeWeb database host")
define("mysql_database", default="maoWeb", help="maoYeWeb database name")
define("mysql_user", default="root", help="maoYeWeb database user")
define("mysql_password", default="", help="maoYeWeb database password")


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/auth/login", AuthLoginHandler),
            (r"/auth/register", AuthRegisterHandler),
            (r"/auth/logout", AuthLogoutHandler),
            (r"/document/([0-9]+)", DocumentHandler),
            (r"/people/([0-9]+)", PeopleHandler),
            (r"/book/([0-9]+)", BookHandler),
            (r"/keyword/s",KeywordHandler),
            (r"/suggest/s", SuggestHandler),
            (r"/insert/document", InsertDocumentHandler),
            (r"/delete/document", DeleteDocumentHandler),
            (r"/insert/category", InsertCategoryHandler),
            (r"/modify/document", ModifyDocumentHandler),
            (r"/rcmd/document", RcmdDocumentHandler),
            (r"/rcmd/people", RcmdPeopleHandler),
            (r"/category/document", CategoryDocumentHandler),
            (r"/category/people", CategoryPeopleHandler),
            (r"/follow/people", FollowPeopleHandler),
            (r"/follow/document", FollowDocumentHandler),
            (r"/doc/hotdoc", HotdocHandler),
            (r".*", BaseHandler)
        ]
        settings = dict(
            cookie_secret="43oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
            login_url="/auth/login",
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            xsrf_cookies=False,
            ui_modules={        
                    "DocInfoUI": DocInfoUI,
                    "PersonInfoUI": PersonInfoUI,
                    "InfoListUI": InfoListUI,
                    "ClockUI":ClockUI,
                    "MainDocUI":MainDocUI,
                    "EditDocUI":EditDocUI,
                    "EditClassifyUI":EditClassifyUI
            },  
        )
        tornado.web.Application.__init__(self, handlers, **settings)
        self.db = torndb.Connection(host=options.mysql_host,database=options.mysql_database,user=options.mysql_user, password=options.mysql_password)



class BaseHandler(tornado.web.RequestHandler):
    @property
    def db(self):
        return self.application.db

    def get_current_user(self):
        user_id = self.get_secure_cookie("user_id")
        email = self.get_secure_cookie("email")
        if not user_id: return None
        return self.db.get("SELECT * FROM authors WHERE id = %s", int(user_id))

    def write_error(self, status_code, **kwargs):
        if status_code == 404:
            self.render('404.html')
        elif status_code == 500:
            self.render('404.html')
        else:
            self.write('error:' + str(status_code))

class MainHandler(BaseHandler):
    def get(self):
        info = self.db.query("SELECT authors.name,authors.head,entries.author_id,entries.id,entries.title,entries.abstract,entries.category_id,entries.published,entries.updated,entries.img FROM entries,authors where authors.id = entries.author_id ORDER BY published DESC LIMIT 0,10");
        content_type = "doc"
        title = "主页"
        hasnext = 1
        if len(info) < 10:
            hasnext = 0

        if not self.current_user:            
            self.render('vister-main.html',content_type=content_type,info=info,title=title,hasnext=hasnext)
            return
        Classify = self.db.query("SELECT * FROM  category where author_id = %s ",int(self.current_user['id']))
        self.render("own-main.html",content_type=content_type,info=info,title=title,Classify=Classify,hasnext=hasnext)

class AuthLoginHandler(BaseHandler):
    def get(self):    
        self.render('login.html')

    def post(self):
        password = self.get_argument("password")
        email = self.get_argument("email")
        author = self.db.get("SELECT * FROM authors WHERE email = %s and password=%s",email,password)
        if not author:
            self.write("0")
            pass
        else:
            self.set_secure_cookie("user_id", str(author.id))
            self.set_secure_cookie("email", author.email)
            self.write("1")
        
class AuthRegisterHandler(BaseHandler):
    def get(self):
        self.render('register.html')
    def post(self):

        password = self.get_argument("password")
        email = self.get_argument("email")
        name = self.get_argument("nickname")
        author = self.db.get("SELECT * FROM authors WHERE email = %s or name = %s",email,name)
        if author:
            self.write('0');
        else:
            author_id = self.db.execute("INSERT INTO authors (email,name,password) VALUES (%s,%s,%s)",email,name,password)
            category_id =  self.db.execute("INSERT INTO category (author_id,classify) VALUES (%s,'未分类')",int(author_id))
            self.set_secure_cookie("user_id", str(author_id))
            self.set_secure_cookie("email", email)
            self.write('1')

class AuthLogoutHandler(BaseHandler):
    def get(self):
        self.clear_cookie("email")
        self.clear_cookie("user_id")
        self.redirect("/")

class DocumentHandler(BaseHandler):
    def get(self,argv):
        docDetail = self.db.get("select authors.name,authors.head,entries.author_id,entries.id,entries.title,entries.abstract,entries.html,entries.category_id,entries.published,entries.updated,entries.img from entries,authors where entries.id = %s and entries.author_id = authors.id",int(argv));
        categoryDetail = self.db.get("select * from category where category.id = %s",docDetail['category_id'])
        if not docDetail:
            raise tornado.web.HTTPError(404)
        docDetail['categoryDetail'] = categoryDetail
        if not self.current_user:
            self.render('document.html',docDetail=docDetail,allow_edit=False,edit_type='modify',title=docDetail['title'])
            return 

        own = self.db.get("select * from entries where id = %s and author_id = %s",argv,self.current_user['id'])        
        if not own:
            self.render('document.html',docDetail=docDetail,allow_edit=False,edit_type='modify',title=docDetail['title'])
            return
        else:
            Classify = self.db.query("SELECT * FROM  category where author_id = %s ",int(self.current_user['id']))
            index = [clfy.id for i,clfy in enumerate(Classify) if clfy.classify == u"未分类"] 
            self.render('document.html',docDetail=docDetail,allow_edit=True,edit_type='modify',title=docDetail['title'],Classify=Classify,index=index[0])
            return

class BookHandler(BaseHandler):
    def get(self,argv):
        self.write("BookHandler")

class KeywordHandler(BaseHandler):
    def get(self):
        self.write("KeywordHandler")

class  PeopleHandler(BaseHandler):
    def get(self,argv):
        self.write("PeopleHandler")

class RcmdDocumentHandler(BaseHandler):
    def post(self):
        page = self.get_argument('page')
        info = self.db.query("SELECT authors.name,authors.head,entries.author_id,entries.id,entries.title,entries.abstract,entries.category_id,entries.img FROM entries,authors where authors.id = entries.author_id ORDER BY published DESC LIMIT %s,10",int(page)*10);
        content_type = "doc";
        jsonR = {};
        jsonR['ret'] = 0;
        jsonR['info'] = self.render_string("modules/Info-list.html",info=info,content_type=content_type);
        jsonR['nextpage'] = str((int(page)+1));
        if len(info) < 10:
            jsonR['hasnext'] = 0
        else:
            jsonR['hasnext'] = 1
        p = json.loads(json.dumps(jsonR));
        self.write(p)

class RcmdPeopleHandler(BaseHandler):
    def post(self):
        pass

class CategoryDocumentHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        page = self.get_argument('page')
        category_id  = self.get_argument('category')
        if category_id == "-1":
            info = self.db.query("SELECT authors.name,authors.head,entries.author_id,entries.id,entries.title,entries.abstract,entries.category_id,entries.img FROM entries,authors where authors.id = entries.author_id and authors.id = %s ORDER BY published DESC LIMIT %s,10",self.current_user['id'] ,int(page)*10);
        else:
            info = self.db.query("SELECT authors.name,authors.head,entries.author_id,entries.id,entries.title,entries.abstract,entries.category_id,entries.img FROM entries,authors where authors.id = entries.author_id and authors.id = %s and entries.category_id = %s ORDER BY published DESC LIMIT %s,10",self.current_user['id'],int(category_id),int(page)*10);
        content_type = "doc";
        jsonR = {};
        jsonR['ret'] = 0;
        jsonR['info'] = self.render_string("modules/Info-list.html",info=info,content_type=content_type);
        jsonR['nextpage'] = str((int(page)+1));
        if len(info) < 10:
            jsonR['hasnext'] = 0
        else:
            jsonR['hasnext'] = 1
        p = json.loads(json.dumps(jsonR));
        self.write(p)

class CategoryPeopleHandler(BaseHandler):
    def post(self):
        if not self.current_user:
            return
        self.write('{"OwnDocumentHandler":123,"data":{"info":[{"mao":123},{"mao":456},{"mao":789}]}}')


class FollowPeopleHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        if not self.current_user:
            return
        self.write("FollowPeopleHandler")

class FollowDocumentHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        if not self.current_user:
            return    
        self.write("FollowDocumentHandler")

class HotdocHandler(BaseHandler):
    def get(self):
        self.write("HotdocHandler")
        
class SuggestHandler(BaseHandler):
    def get(self):
        self.write('[["people","Adwelling","../static/bafc47281_m.jpg","12138","今年一定要多送出赞同和感谢"],["people","Adam Suen","../static/bafc47281_m.jpg","181818","食品专业，业余音乐人"],["people","AdieuS","../static/bafc47281_m.jpg","191919","Dreamer / Whovian / Vamos Espana"],["keyword","广告代理商",""],["keyword","Adobe Photoshop",""],["keyword","Adobe",""],["document","hfss到ad怎么转换？","",22106130,0,0],["document","提莫出ad好吗？","",20722351,12,0],["document","为什么会出现 Ad exchange？","",20320181,8,0],["document","通俗介绍一下 Ad Network？","",20363959,10,0]]')

class InsertDocumentHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        Classify = self.db.query("SELECT * FROM  category where author_id = %s ",int(self.current_user['id']))
        index = [clfy.id for i,clfy in enumerate(Classify) if clfy.classify == u"未分类"] 
        self.render('insert.html',edit_type='insert',title="添加新文章",Classify=Classify,edit_display=True,index = index[0])
        pass    

    @tornado.web.authenticated
    def post(self):
        textcontent = self.get_argument('textcontent')
        html = self.get_argument('html')
        title = self.get_argument('title')   
        category_id = self.get_argument('category') 
        abstract  = textcontent[0:150]
        stime = time.strftime('%Y-%m-%d %H:%M:%S')
        inReturn = self.db.execute("insert INTO entries(author_id,title,abstract,textcontent,html,published,category_id) "
                                    "VALUES(%s,%s,%s,%s,%s,%s,%s)",
                                    self.current_user['id'],title,abstract,textcontent,html,stime,int(category_id))
        if not inReturn:
            self.write("0")
        else:        
            inCategory = self.db.execute("update category set numdoc = numdoc + 1 where id = %s",int(category_id))
            self.write(str(inReturn))

class DeleteDocumentHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        docid = self.get_argument('docid')
	doclist =  self.db.get("select entries.category_id from entries where entries.id = %s",docid)
        if not doclist:
            raise tornado.web.HTTPError(404)
        upCategory = self.db.execute("update category set numdoc = numdoc - 1 where category.id = %s ",doclist['category_id'])
        inReturn = self.db.execute("delete from entries where id = %s",int(docid));
	

class InsertCategoryHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        category = self.get_argument('category')
        inReturn = self.db.execute("insert INTO category(author_id,classify) "
                                    "VALUES(%s,%s)",self.current_user['id'],category)
        if not inReturn:
            self.write('0')
        else:
            self.write(str(inReturn))


class ModifyDocumentHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        textcontent = self.get_argument('textcontent')
        html = self.get_argument('html')
        title = self.get_argument('title')   
        docid = self.get_argument('docid')
        category_id = self.get_argument('category')
        abstract = textcontent[0:150]
	doclist =  self.db.get("select entries.category_id from entries where entries.id = %s",docid)
	upCategory_1 = self.db.execute("update category set numdoc = numdoc - 1 where category.id = %s ",doclist['category_id'])
 	upCategory_2 = self.db.execute("update category set numdoc = numdoc + 1 where category.id = %s ",int(category_id))

        upReturn = self.db.execute_rowcount("update entries set title = %s,textcontent = %s,html = %s,abstract= %s,category_id=%s where id = %s;",title,textcontent,html,abstract,int(category_id),int(docid))
        if not upReturn:
            self.write('0')
        else:
            self.write('1')        

class DocInfoUI(tornado.web.UIModule):
    def render(self,info_doc):
        return self.render_string("modules/DocInfo.html",info_doc=info_doc)

class PersonInfoUI(tornado.web.UIModule):
    def render(self,info_person):
        return self.render_string("modules/PersonInfo.html",info_person=info_person)

class InfoListUI(tornado.web.UIModule):
    def render(self,content_type,info,list_size = 20):
        return self.render_string("modules/Info-list.html",content_type=content_type,info=info,list_size=list_size)

class ClockUI(tornado.web.UIModule):
    def render(self):
        return self.render_string("modules/clock.html")

class EditDocUI(tornado.web.UIModule):
    def render(self,edit_type,index, default_height=500):
        return self.render_string("modules/EditDoc.html",edit_type=edit_type,index = index)

class EditClassifyUI(tornado.web.UIModule):
    def render(self,Classify,edit_display = True):
        return self.render_string("modules/EditClassify.html",Classify=Classify,edit_display=edit_display)

class MainDocUI(tornado.web.UIModule):
    def render(self,docDetail,allow_edit):
        return self.render_string("modules/MainDoc.html",docDetail=docDetail,allow_edit=allow_edit)

def main():
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
