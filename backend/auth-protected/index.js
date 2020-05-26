exports.handler = async (event) => {

  let response = {
    statusCode: '200',
    body: "[]",
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Credentials' : true
    }  
  };

  let user = null;
  if(event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.user){
      user = event.requestContext.authorizer.user;
  }

  if(!user){
    response.statusCode = 401;
    response.body = "{\"error\":\"Unauthorized\"}";
  }else{
    response.body = "{\"message\": \"super secret service for " + user +". Your bank account, profile, whatever...\"}";
  }

  return response;
};