<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $notifications = Notification::where(function($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->orWhereNull('user_id');
        })
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($notifications);
    }

    /**
     * Mark the specified notification as read.
     */
    public function markAsRead(string $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['read_at' => now()]);

        return response()->json($notification);
    }
}
