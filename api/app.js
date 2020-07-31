const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {mongoose} = require('./db/mongoose');
const port = process.env.PORT || 8080;
const jwt = require('jsonwebtoken');

//load middleware

app.use(bodyParser.json());

//Setting cors headers for responses.
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});


// check whether the request has a valid JWT access token
let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');

    // verify the JWT
    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if (err) {
            // there was an error
            // jwt is invalid - * DO NOT AUTHENTICATE *
            res.status(401).send(err);
        } else {
            // jwt is valid
            req.user_id = decoded._id;
            next();
        }
    });
}

// Verify Refresh Token Middleware (which will be verifying the session)
let verifySession = (req, res, next) => {
    // grab the refresh token from the request header
    let refreshToken = req.header('x-refresh-token');

    // grab the _id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            // user couldn't be found
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }


        // if the code reaches here - the user was found
        // therefore the refresh token exists in the database - but we still have to check if it has expired or not

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                // check if the session has expired
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    // refresh token has not expired
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            // the session is VALID - call next() to continue with processing this web request
            next();
        } else {
            // the session is not valid
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}


//Models
const {Task, WorkItem, User} = require('./db/models');

//List of routes

//return an array of all tasks in db
app.get('/tasks', authenticate ,(req, res) => {
    Task.find({
        _userId: req.user_id
    }).then((tasks) =>{
        res.send(tasks);
    }).catch((e) => {
        res.send(e);
    });
})


//Create new task in db
app.post('/tasks', authenticate ,(req, res) => {
    let title = req.body.title;

    let newTask = new Task({
        title,
        _userId: req.user_id
    });
    newTask.save().then((taskDoc) => {
            res.send(taskDoc);
    })
});


//update specified task in db
app.patch('/tasks/:id', authenticate ,(req, res) => {
    Task.findOneAndUpdate({ _id: req.params.id, _userId: req.user_id}, {
        $set: req.body
    }).then(()=>{
        res.send({ 'message': 'updated successfully!'});
    });
});


//delete specific task for db
app.delete('/tasks/:id', authenticate ,(req, res) => {
    Task.findByIdAndRemove({
       _id: req.params.id,
       _userId: req.user_id
    }).then((removedTaskDoc) =>{
        res.send(removedTaskDoc);

        deleteItemFromTask(removedTaskDoc._id);
    })
});

//get work items for a task

app.get('/tasks/:taskId/workitems', authenticate ,(req, res) => {
console.log("working");
    WorkItem.find({

        _taskId: req.params.taskId
    }).then((workitem) => {       
        res.send(workitem);
    })
});

/*app.get('/tasks/:taskId/workitems/:itemid', (req, res) => {
    WorkItem.findOne({
        _id: req.params.itemid,
        _taskId: req.params.taskId
    }).then((workitem) =>{
        res.send(workitem);
    })
});*/




app.post('/tasks/:taskId/workitems', authenticate ,(req, res) => {

    Task.findOne({
        _id: req.params.taskId,
        _userId: req.user_id
    }).then((task) => {
        if(task){

            return true;
        }
        return false;
    }).then((canCreateItem) => {
        if(canCreateItem){
           
            let newWorkItem = new WorkItem({
                title: req.body.title,
                _taskId: req.params.taskId
        
            });
        
            newWorkItem.save().then((newWorkDoc) => {
                res.send(newWorkDoc);
            });
        } else {
            res.sendStatus(404);
        }
    })

  
   
});



app.patch('/tasks/:taskId/workitems/:itemid',authenticate ,(req, res)=> {


    Task.findOne({
        _id: req.params.taskId,
        _userId: req.user_id
    }).then((task) => {
        if(task){

            return true;
        }
        return false;
    }).then((canUpdateItems) => {
        if(canUpdateItems) {
            WorkItem.findByIdAndUpdate({
                _id: req.params.itemid,
                _taskId: req.params.taskId
            },{
                $set: req.body
            }).then(()=> {
                res.send({message: 'Updated!'})
            })
        } else {
            res.sendStatus(404);
        }
    })


});

app.delete('/tasks/:taskId/workitems/:itemid', authenticate ,(req, res)=>{

    Task.findOne({
        _id: req.params.taskId,
        _userId: req.user_id
    }).then((task) => {
        if(task){

            return true;
        }
        return false;
    }).then((canDeleteItems) => {
        if(canDeleteItems) {
            
            WorkItem.findByIdAndRemove({
                _id: req.params.itemid,
                _taskId: req.params.taskId
            }).then((removedWorkDoc) =>{
                res.send(removedWorkDoc);
            })

        } else {
            res.sendStatus(404);
        }
    })



    
})

//User routes

// -> POST /users
app.post('/users', (req, res) => {
    let body = req.body;
    let newUser = new User(body);
    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken)=> {
        return newUser.generateAccessAuthToken().then((accessToken) =>{
            return {accessToken, refreshToken}
        });
    }).then((authToken) => {
        res
            .header('x-refresh-token', authToken.refreshToken)
            .header('x-access-token', authToken.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})

app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            // Session created successfully - refreshToken returned.
            // now we geneate an access auth token for the user

            return user.generateAccessAuthToken().then((accessToken) => {
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})

app.get('/users/me/access-token', verifySession, (req, res) => {
    // we know that the user/caller is authenticated and we have the user_id and user object available to us
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})

/* HELPER METHODS */
let deleteItemFromTask = (_taskId) => {
    WorkItem.deleteMany({
        _taskId
    }).then(() => {
        console.log("Items from " + _taskId + " were deleted!");
    })
}



app.listen(port, () => {
    console.log("Server is now running!");
})