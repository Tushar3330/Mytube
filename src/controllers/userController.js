import {asyncHandler} from '../utils/asynchandler.js';
import User from '../models/user.js';

const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "User Registered Successfully",
    });
    
});

export {registerUser};


