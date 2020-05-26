# SAML Auth with JWT Generator

This is an extensible SAML Auth Endpoint to get JWT tokens.

* It will generate a JWT Token after user login. 
* To manage it from client side, you have to capture PostMessage. Sample code at the end or in [html frontend](html/index.html).
* if you deploy with serverless framework complete working sample is available (with custom auth, private endpoint), without setup, consuming [https://samltest.id/](https://samltest.id/). You only have to upload [SP metadata](docs/sp-metadata.xml) and change <md:AssertionConsumerService Location="..."> with your api gateway endpoint.

## Install dependencies

		$ cd backend
		$ npm install

## Working modes

* Local/Container/PaaS
* AWS Lambda environment

## AWS Lambda deployment requirements

* Serverless framework: https://www.serverless.com/framework/docs/getting-started/
* Setup AWS credentials: https://www.serverless.com/framework/docs/providers/aws/cli-reference/config-credentials/
* Install "serverless-s3-sync" plugin

        $ npm install --save serverless-s3-sync

* Update "serviceName" with your own in [setup.demo.json](https://github.com/davidayalas/saml-jwt/blob/master/setup.demo.json#L2)

* Basic env variables (default values point to [https://samltest.id/](https://samltest.id/)):

    - SAML_CERT: you idp saml certificate as string
    - IDP_HOST: your idp
    - JWT_SECRET: to sign JWT from SAML and validate from custom authorizer<br />

	- [Metadata](/docs/sp-metadata.xml) for samltest.id is generated with [https://www.samltool.com/sp_metadata.php](https://www.samltool.com/sp_metadata.php):
		- In "Attribute Consume Service Endpoint (HTTP-POST)" you have to put your api endpoint:

				https://${api gateway id}.execute-api.${region}.amazonaws.com/${stage}/login/callback

* Deploy demo

        $ sls deploy
        $ sls info | grep ANY -m 1 | awk -F[/:] '{printf "var endpoint='\''https://"$4"'\'';"}' > html/endpoint.js
        $ sls s3sync

* Custom authorizer and protected service
	* custom auth uses the token generated from SAML-JWT
	* decodes and validate it, and with the user id, search with [S3 Select](https://github.com/davidayalas/saml-jwt/blob/master/backend/custom-auth/index.js#L31) over [permissions.csv](html/permissions.csv) for specific user permissions (only for demo purposes)
	* it allows request or not the /private endpoint

## Environment variables

- IDP_HOST = your idp host
- STAGE = demo, pre, pro (when exposing through AWS - API GW is mandatory to ensure redirects)

- SAML_DOMAIN = [API GW HOST]
- SAML_CERT = IDP public signing certificate
- SAML_PRIVATE_CERT = private cert
- SAML_ISSUER = your sp id
- SAML_ENTRY_POINT: instead of IDP_HOST, you can specify your IDP entry point detailed.

- JWT_SECRET = signing secret
- JWT_SAML_PROFILE = keys from the SAML Profile to add and sign in JWT Token (e.g. for auth purposes later)
- JWT_SAML_TTL = ttl in seconds

- ALLOWED_DOMAINS = domains, separated by comma, to allow postmessage
- ALLOWED_HOSTS_PATTERNS = host patterns (e.g. "subdomain.domain.com"), separated by comma, to allow postmessage. Useful to trust your own domain and don't need to declare ALLOWED_DOMAINS individually


## Sample client code to get JWT
		<html>
		<head></head>
		<body>
			<span id="user" style="display:none"></span>
			<a id="login" href="#">Log in with SAML</a>

			<script
				src="https://code.jquery.com/jquery-3.3.1.min.js"
				integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
				crossorigin="anonymous"></script>

			<script>
			
				var jwtUrl = "https://yourdomain.com";
				var jwtPath = "/yourpath";
			    
				function decoder(base64url) {
					try {
						var base64 = base64url.replace('-', '+').replace('_', '/')
						var utf8 = atob(base64)
						var json = JSON.parse(utf8)
						var json_string = JSON.stringify(json, null, 4)
					} catch (err) {
						json_string = "Bad Section.\nError: " + err.message
					}
					return json_string
				}
				
				var loginWindow;
				$("#login").on("click", function(){
					loginWindow = window.open(jwtUrl+jwtPath);
				});
				
				window.addEventListener('message', function(e) {
					if(e.origin !== jwtUrl){
						return;
					}
					loginWindow.close();
					var message = JSON.parse(decoder(e.data.split(".")[1]));
					$("#user").html("Hi, " + message["user"]);
					$("#user").css("display", "block");
					$("#login").css("display", "none");
				});
			</script>
		</body>
		</html>
