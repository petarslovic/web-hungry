<?php

namespace Hungry\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Menu extends Model
{
  protected $casts = [
    'published' => 'boolean',
  ];

  protected $fillable = [
    'date',
    'published',
    'week',
    'created_at',
    'updated_at'
  ];

  public function getDates() {
      return array(static::CREATED_AT, static::UPDATED_AT, 'date');
  }

  public function menuFoods() {
    return $this->hasMany('Hungry\Models\MenuFood');
  }

  public static function createMenusForWeek($week) {
    $now = Carbon::now('Europe/Belgrade')->toDateTimeString();

    $weekMon = Carbon::createFromTimeStamp( (int) $week);
    $weekDays = [
      'mon' => $weekMon,
      'tue' => $weekMon->copy()->addDays(1),
      'wed' => $weekMon->copy()->addDays(2),
      'thu' => $weekMon->copy()->addDays(3),
      'fri' => $weekMon->copy()->addDays(4)
    ];

    $defaultFoods = Food::where('default', true)->get();

    $newMenus = [];
    foreach ($weekDays as $dayAbbr => $day) {
      $newMenu = Menu::create([
        'date' => $day,
        'week' => $week,
        'published' => false,
        'created_at' => $now,
        'updated_at' => $now
      ]);

      foreach ($defaultFoods as $defaultFood) {
        MenuFood::create([
          'food_id' => $defaultFood->id,
          'menu_id' => $newMenu->id
        ]);
      }

      $newMenus[] = $newMenu->id;
    }

    return self::with(['menuFoods', 'menuFoods.menu', 'menuFoods.food'])->find($newMenus);
  }

  public static function isPublishedForWeek($week) {
    $publishedMenus = self::where('week', $week)->where('published', true)->get();
    return !$publishedMenus->isEmpty();
  }

  public static function getNumOrdersForWeek($week) {
    return self::where('week', $week)->get()->sum(function($menu) {
      return $menu->menuFoods->sum(function($menuFood) {
        return $menuFood->eatenBy->count();
      });
    });
  }

  public static function getNumOrdersForWeekAndFood($week, $food) {
    return self::where('week', $week)->get()->sum(function($menu) use($food) {
      return $menu->menuFoods->where('food_id', $food->id)->sum(function($menuFood) {
        return $menuFood->eatenBy->count();
      });
    });
  }

  public static function getCateringEmailData($week) {
    $users = \Hungry\Models\User::get();
    $allEatenFoodWeek = $users->map(function($user) use($week) {
      return $user->eatenFoodForWeek($week);
    })->collapse();

    $allEatenFoodWeek = $allEatenFoodWeek->sortBy(function($menuFood) {
      return $menuFood['menu']['date'];
    });

    $menuFoodsByDate = $allEatenFoodWeek->groupBy(function($menuFood) {
      if(isset($menuFood->menu)) {
        return $menuFood->menu->date->format('d.m.Y');
      } else {
        return Menu::find($menuFood['menu']['id'])->date->format('d.m.Y');
      }
    });

    // Group by food name
    $menuFoodsByDate = $menuFoodsByDate->map(function($menuFoods) {
      return $menuFoods->groupBy(function($mf) {
        if(isset($mf->food)) {
          return $mf->food->description;
        } else {
          return $mf['food']['description'];
        }
      });
    });

    // Calculate counts for each food
    $menuFoodsByDate = $menuFoodsByDate->map(function($differentMenuFoods) {
      return $differentMenuFoods->map(function($menuFoods) {
        return $menuFoods->count();
      })->sortByDesc(function($count) {
        return $count;
      });
    });

    // dd($menuFoodsByDate);

    return $menuFoodsByDate;
  }
}
