import { createActionGroup, emptyProps, props } from "@ngrx/store";
import { UserDto } from "../../../feature/users/data/user.dto";

export const AuthActions = createActionGroup({
    source: 'Auth',
    events: {
        'Login': props<{ email: string, password: string }>(),
        'Login Success': props<{ accessToken: string }>(),
        'Login Failure': props<{ error: string }>(),
        
        'Load User': emptyProps(),
        'Load User Success': props<{ user: UserDto }>(),
        'Load User Failure': props<{ error?: string }>(),
        
        'Logout': emptyProps(),
    }  
})