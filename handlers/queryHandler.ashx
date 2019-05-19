<%@ WebHandler Language="C#" Class="queryHandler" %>

using System;
using System.Web;
using System.Diagnostics;
using System.Collections.Generic;
using MySql.Data.MySqlClient;
using Newtonsoft.Json;

public class queryHandler : IHttpHandler
{

    public void ProcessRequest (HttpContext context)
    {
        //String specifier = context.Request.QueryString.ToString().Replace("+"," ");
        String specifier = HttpUtility.UrlDecode(context.Request.QueryString.ToString());
        String date = DateTime.Now.ToString("MM/dd");
        //确定场次（5/1及5/3属于第一场
        int session = (date.Equals("05/03") || date.Equals("05/01")?0:1);

        MySqlIntegration selectInteg = new MySqlIntegration();
        String[] keys = { "*" };
        //MySqlDataReader mysqlReader = selectInteg.mySqlSelect("scores", keys, "session=" + session + " " + specifier);
        List<Dictionary<String, String>> scores = selectInteg.mySqlSelect("scores", keys, "session=" + session + " " + specifier);
        Dictionary<String, String> dic = new Dictionary<String, String>();

        context.Response.Write(JsonConvert.SerializeObject(scores));
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

}