#!/usr/bin/perl
# Builds the site from template/ + pages/ + partials/ into dist/.
#
#   perl build.pl            preview build (yellow review marks, preview bar, hidden from Google)
#   perl build.pl --final    clean build for the live site -> dist-final/
#
# Folder layout:
#   site.conf                key = value settings
#   site.css                 colours and fonts
#   template/layout.html     page skeleton
#   template/assets/         base.css, site.js, icons.svg
#   partials/header.<lang>.html, footer.<lang>.html, head.<lang>.html
#   pages/he/*.html, pages/en/*.html   page body with a front-matter block
#   images/                  web-ready photos and artwork
#
# Placeholders available in pages and partials:
#   {{root}}  path prefix to the site root ("" or "../")
#   {{alt}}   same page in the other language
#   {{cur:library}}  becomes aria-current="page" on the matching page
#   {{wa:text}}   WhatsApp link with a pre-filled message
#   any key from site.conf, e.g. {{phone}}; keys ending in _he/_en resolve per language
use strict;
use warnings;
use File::Path qw(make_path remove_tree);
use File::Copy qw(copy);
use FindBin qw($Bin);

my $final = grep { $_ eq '--final' } @ARGV;
my $out   = "$Bin/dist" . ($final ? '-final' : '');

sub slurp { my $f = shift; open my $fh, '<:raw', $f or die "$f: $!"; local $/; my $s = <$fh>; close $fh; $s }
sub spew  { my ($f, $s) = @_; open my $fh, '>:raw', $f or die "$f: $!"; print $fh $s; close $fh }
sub urlenc { my $s = shift; $s =~ s/([^A-Za-z0-9\-._~])/sprintf('%%%02X', ord $1)/ge; $s }

my %conf;
for (split /\r?\n/, slurp("$Bin/site.conf")) {
  next if /^\s*(#|$)/;
  my ($k, $v) = /^\s*([\w.-]+)\s*=\s*(.*?)\s*$/ or next;
  $conf{$k} = $v;
}

remove_tree($out);
make_path("$out/assets", "$out/images", "$out/en");

my $layout = slurp("$Bin/template/layout.html");
my %langs = (he => { dir => 'rtl', root => '', other => 'en', og => 'he_IL', skip => 'דלגו לתוכן' },
             en => { dir => 'ltr', root => '../', other => 'he', og => 'en_US', skip => 'Skip to content' });
my $pages = 0;

for my $lang (sort keys %langs) {
  my $L = $langs{$lang};
  my $pdir = "$Bin/pages/$lang";
  next unless -d $pdir;
  opendir my $dh, $pdir or die $!;
  for my $file (sort grep { /\.html$/ } readdir $dh) {
    my $src = slurp("$pdir/$file");
    my %fm;
    if ($src =~ s/\A---\r?\n(.*?)\r?\n---\r?\n//s) {
      for (split /\r?\n/, $1) { $fm{$1} = $2 if /^\s*([\w-]+)\s*:\s*(.*?)\s*$/ }
    }
    (my $base = $file) =~ s/\.html$//;
    my $name = $conf{"site_name_$lang"} // $conf{site_name};
    my %v = (%conf,
      lang => $lang, dir => $L->{dir}, root => $L->{root}, og_locale => $L->{og}, skip_label => $L->{skip},
      page => $file, page_he => $file, page_en => $file,
      alt => ($lang eq 'he' ? "en/$file" : "../$file"),
      site_name => $name,
      title => ($fm{title} ? ($base eq 'index' ? $fm{title} : "$fm{title} | $name") : $name),
      description => $fm{description} // '',
      og_image => $fm{og_image} // $conf{og_image} // '',
      body_class => join(' ', "page-$base", $fm{body_class} // ()),
      mode => $final ? 'final' : 'preview',
      robots => $final ? 'index, follow' : 'noindex, nofollow',
      preview_bar => $final ? '' : qq{<div class="preview-bar" role="note">} . ($conf{"preview_$lang"} // 'Preview') . qq{</div>},
      content => $src,
    );
    # language-specific conf keys: foo_he -> foo
    for my $k (keys %conf) { $v{$1} = $conf{$k} if $k =~ /^(.+)_\Q$lang\E$/ }
    for my $part (qw(header footer head_extra)) {
      my $pf = "$Bin/partials/" . ($part eq 'head_extra' ? 'head' : $part) . ".$lang.html";
      $v{$part} = -f $pf ? slurp($pf) : '';
    }

    my $html = $layout;
    for my $pass (1 .. 4) {
      $html =~ s/\{\{cur:([\w-]+)\}\}/$1 eq $base ? ' aria-current="page"' : ''/ge;
      $html =~ s/\{\{wa:(.*?)\}\}/"https:\/\/wa.me\/$conf{whatsapp}?text=" . urlenc($1)/ge;
      $html =~ s/\{\{(\w+)\}\}/exists $v{$1} ? $v{$1} : "{{$1}}"/ge;
    }
    my %missing = map { $_ => 1 } $html =~ /\{\{([\w:]+)\}\}/g;
    warn "  $lang/$file: unresolved {{$_}}\n" for sort keys %missing;

    spew(($lang eq 'he' ? "$out/$file" : "$out/en/$file"), $html);
    $pages++;
  }
  closedir $dh;
}

sub copy_dir {
  my ($from, $to) = @_;
  return unless -d $from;
  opendir my $dh, $from or die $!;
  for (grep { !/^\./ } readdir $dh) {
    if (-d "$from/$_") { make_path("$to/$_"); copy_dir("$from/$_", "$to/$_") }
    else { copy("$from/$_", "$to/$_") or die "copy $_: $!" }
  }
  closedir $dh;
}
copy_dir("$Bin/template/assets", "$out/assets");
copy_dir("$Bin/images", "$out/images");
copy_dir("$Bin/static", $out);
copy("$Bin/site.css", "$out/assets/host.css") or die "site.css: $!";
spew("$out/robots.txt", $final
  ? "User-agent: *\nAllow: /\nSitemap: $conf{site_url}/sitemap.xml\n"
  : "User-agent: *\nDisallow: /\n");

print "Built $pages pages -> $out" . ($final ? " (final)" : " (preview)") . "\n";
